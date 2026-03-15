---
applyTo: "worker/**/*,mcp_servers/**/*"
---

# Worker Video + MCP Instructions

Use these instructions whenever editing files in `worker/` or `mcp_servers/` that affect clip production, rendering, FFmpeg orchestration, subtitles, overlays, or audio.

## Primary Rule

Prefer the local MCP server `union-ffmpeg` for media operations when MCP tooling is available in the session. The canonical configuration lives in `.mcp.json`, and the server entrypoint is `mcp_servers/union_ffmpeg/server.py`.

## When to Prefer MCP

Use `union-ffmpeg` first for:

- extracting or trimming segments
- concatenating multiple moments into one clip
- burning subtitles or generating SRT files
- adding Union branding, cards, fades, intro/outro
- mixing background music and ducking speech
- applying ready-made clip templates

Avoid writing ad-hoc raw `ffmpeg` command strings unless the MCP server cannot cover the operation.

## Available Tool Families

- Inspection: `get_media_info`
- Cutting: `trim_video`, `remove_silence`, `concatenate_videos`
- Visual composition: `change_resolution`, `add_image_overlay`, `add_union_logo`, `create_text_card`, `add_fade_effect`
- Subtitles: `generate_srt_file`, `burn_subtitles`
- Audio: `audio_duck`, `mix_background_music`, `boost_volume`, `select_music_by_mood`
- Union templates: `add_union_intro_outro`, `apply_template_reaction`, `apply_template_split_horizontal`, `apply_template_grande_momento`, `apply_template_resenha`
- Reporting: `generate_production_report`

## Expected Workflow

For a new produced clip, prefer this sequence:

1. inspect input media
2. extract exact ranges using timestamps in seconds
3. concatenate narrative segments if required
4. add subtitles and logo/overlays
5. apply audio treatment and optional mood music
6. apply template or intro/outro only if it improves the intended platform output
7. emit a report or metadata object suitable for persistence/debugging

## Union-Specific Constraints

- Preserve the Union brand look and dark visual identity.
- Favor numeric timestamps in seconds, never `NaN`, vague strings, or approximate times.
- Do not overwrite original source files.
- Keep production decisions consistent with `worker/app/processors/producer_mcp.py`.
- Validate that required assets exist in `worker/assets/` before referencing them.
- When building automation, keep compatibility with the registered MCP server name `union-ffmpeg`.

## Fallback Rule

If MCP execution is unavailable in the current environment, keep implementations aligned with the MCP server contract and use `worker/app/processors/producer_mcp.py` as the functional reference instead of inventing a parallel FFmpeg pipeline.