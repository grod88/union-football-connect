"""Deterministic clip deduplication for the Produtor stage."""

import re
from typing import Any


def _safe_float(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    return None


def _normalize_text(value: Any) -> str:
    text = str(value or "").strip().lower()
    text = re.sub(r"[^a-z0-9à-ÿ\s]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _token_set(value: Any) -> set[str]:
    return {token for token in _normalize_text(value).split() if len(token) >= 4}


def _extract_clip_segments(clip: dict[str, Any]) -> list[tuple[float, float]]:
    segments: list[tuple[float, float]] = []

    raw_segments = clip.get("segments")
    if isinstance(raw_segments, list):
        for segment in raw_segments:
            if not isinstance(segment, dict):
                continue

            start = _safe_float(segment.get("start"))
            end = _safe_float(segment.get("end"))

            if start is None:
                start = _safe_float(segment.get("start_time"))
            if end is None:
                end = _safe_float(segment.get("end_time"))

            if start is None or end is None:
                continue

            if end < start:
                start, end = end, start

            segments.append((start, end))

    if segments:
        return segments

    start = _safe_float(clip.get("start_time"))
    end = _safe_float(clip.get("end_time"))
    if start is not None and end is not None:
        if end < start:
            start, end = end, start
        return [(start, end)]

    return []


def _merge_ranges(ranges: list[tuple[float, float]]) -> list[tuple[float, float]]:
    if not ranges:
        return []

    ordered = sorted(ranges, key=lambda item: item[0])
    merged: list[list[float]] = [[ordered[0][0], ordered[0][1]]]

    for start, end in ordered[1:]:
        current = merged[-1]
        if start <= current[1] + 0.5:
            current[1] = max(current[1], end)
        else:
            merged.append([start, end])

    return [(start, end) for start, end in merged]


def _range_overlap(a: tuple[float, float], b: tuple[float, float]) -> float:
    intersection = max(0.0, min(a[1], b[1]) - max(a[0], b[0]))
    if intersection <= 0:
        return 0.0

    shorter = min(max(a[1] - a[0], 0.001), max(b[1] - b[0], 0.001))
    return intersection / shorter


def _clips_overlap(clip_a: dict[str, Any], clip_b: dict[str, Any]) -> bool:
    ranges_a = _merge_ranges(_extract_clip_segments(clip_a))
    ranges_b = _merge_ranges(_extract_clip_segments(clip_b))

    if not ranges_a or not ranges_b:
        return False

    for range_a in ranges_a:
        for range_b in ranges_b:
            if _range_overlap(range_a, range_b) >= 0.6:
                return True

    return False


def _clip_theme_tokens(clip: dict[str, Any]) -> set[str]:
    values = [
        clip.get("title"),
        clip.get("hook"),
        clip.get("key_phrase"),
        clip.get("story_summary"),
        clip.get("key_insight"),
        clip.get("arc_type"),
        clip.get("analysis_type"),
    ]

    tokens: set[str] = set()
    for value in values:
        tokens.update(_token_set(value))
    return tokens


def _clips_same_theme(clip_a: dict[str, Any], clip_b: dict[str, Any]) -> bool:
    tokens_a = _clip_theme_tokens(clip_a)
    tokens_b = _clip_theme_tokens(clip_b)

    if not tokens_a or not tokens_b:
        return False

    overlap = len(tokens_a & tokens_b)
    return overlap >= 2


def _infer_duration(clip: dict[str, Any]) -> float:
    duration = _safe_float(clip.get("duration"))
    if duration is not None and duration > 0:
        return duration

    duration = _safe_float(clip.get("total_duration"))
    if duration is not None and duration > 0:
        return duration

    segments = _extract_clip_segments(clip)
    if segments:
        return sum(max(0.0, end - start) for start, end in segments)

    return 0.0


def _score_clip(agent_name: str, clip: dict[str, Any]) -> float:
    duration = _infer_duration(clip)
    score = {
        "garimpeiro": 70.0,
        "cronista": 68.0,
        "analista": 66.0,
    }.get(agent_name, 60.0)

    if agent_name == "garimpeiro":
        if 15 <= duration <= 30:
            score += 12
        elif duration <= 45:
            score += 6
        score += (_safe_float(clip.get("energy_level")) or 0) * 10

    if agent_name == "cronista":
        if duration >= 35:
            score += 10
        if len(_extract_clip_segments(clip)) >= 2:
            score += 8

    if agent_name == "analista":
        if 30 <= duration <= 70:
            score += 10
        if _normalize_text(clip.get("analysis_type")):
            score += 2

    return score


def _prefer_clip(candidate: dict[str, Any], incumbent: dict[str, Any]) -> dict[str, Any]:
    candidate_agent = str(candidate.get("_source_agent") or "")
    incumbent_agent = str(incumbent.get("_source_agent") or "")
    candidate_duration = _infer_duration(candidate)
    incumbent_duration = _infer_duration(incumbent)

    if {candidate_agent, incumbent_agent} == {"garimpeiro", "cronista"}:
        shorter = candidate if candidate_duration < incumbent_duration else incumbent
        longer = incumbent if shorter is candidate else candidate
        if _infer_duration(shorter) <= 30:
            return shorter if shorter.get("_source_agent") == "garimpeiro" else longer
        return longer if longer.get("_source_agent") == "cronista" else shorter

    candidate_score = _score_clip(candidate_agent, candidate)
    incumbent_score = _score_clip(incumbent_agent, incumbent)

    if candidate_score != incumbent_score:
        return candidate if candidate_score > incumbent_score else incumbent

    return candidate if candidate_duration >= incumbent_duration else incumbent


def deduplicate_worker_clips(
    garimpeiro_clips: list[dict[str, Any]],
    cronista_clips: list[dict[str, Any]],
    analista_clips: list[dict[str, Any]],
) -> tuple[dict[str, list[dict[str, Any]]], list[dict[str, Any]]]:
    """Deterministically deduplicate worker clips before the LLM plan stage."""
    catalog: list[dict[str, Any]] = []
    for agent_name, clips in (
        ("garimpeiro", garimpeiro_clips),
        ("cronista", cronista_clips),
        ("analista", analista_clips),
    ):
        for clip in clips:
            item = dict(clip)
            item["_source_agent"] = agent_name
            catalog.append(item)

    kept: list[dict[str, Any]] = []
    dropped: list[dict[str, Any]] = []

    for candidate in catalog:
        duplicate_index: int | None = None

        for index, incumbent in enumerate(kept):
            same_moment = _clips_overlap(candidate, incumbent)
            same_theme = _clips_same_theme(candidate, incumbent)
            if same_moment or (same_theme and same_moment):
                duplicate_index = index
                break

        if duplicate_index is None:
            kept.append(candidate)
            continue

        incumbent = kept[duplicate_index]
        winner = _prefer_clip(candidate, incumbent)
        loser = candidate if winner is incumbent else incumbent

        if winner is candidate:
            kept[duplicate_index] = candidate

        dropped.append({
            "source_agent": loser.get("_source_agent"),
            "source_clip_id": loser.get("id"),
            "reason": (
                f"Duplicado por sobreposição de timestamps com {winner.get('_source_agent')} "
                f"{winner.get('id')}; priorizamos a versão mais forte para o mesmo momento."
            ),
        })

    deduped = {
        "garimpeiro": [],
        "cronista": [],
        "analista": [],
    }

    for clip in kept:
        agent_name = str(clip.get("_source_agent") or "")
        clean_clip = {key: value for key, value in clip.items() if not key.startswith("_")}
        deduped.setdefault(agent_name, []).append(clean_clip)

    return deduped, dropped
