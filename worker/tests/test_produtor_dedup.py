import unittest

from worker.app.utils.produtor_dedup import deduplicate_worker_clips


class ProdutorDedupTests(unittest.TestCase):
    def test_prefers_garimpeiro_for_short_overlap(self):
        deduped, dropped = deduplicate_worker_clips(
            garimpeiro_clips=[
                {
                    "id": "viral_001",
                    "title": "Gol com reação instantânea",
                    "start_time": 100,
                    "end_time": 126,
                    "duration": 26,
                    "key_phrase": "OLHA O GOL",
                    "energy_level": 0.95,
                }
            ],
            cronista_clips=[
                {
                    "id": "arc_001",
                    "title": "A virada emocional do gol",
                    "arc_type": "redenção",
                    "total_duration": 28,
                    "segments": [
                        {"start_time": 102, "end_time": 128, "type": "content"}
                    ],
                    "story_summary": "Mesmo momento contado como mini arco",
                }
            ],
            analista_clips=[],
        )

        self.assertEqual(len(deduped["garimpeiro"]), 1)
        self.assertEqual(len(deduped["cronista"]), 0)
        self.assertEqual(deduped["garimpeiro"][0]["id"], "viral_001")
        self.assertEqual(len(dropped), 1)
        self.assertEqual(dropped[0]["source_clip_id"], "arc_001")

    def test_prefers_cronista_for_longer_story_arc(self):
        deduped, dropped = deduplicate_worker_clips(
            garimpeiro_clips=[
                {
                    "id": "viral_010",
                    "title": "Explosão no gol",
                    "start_time": 500,
                    "end_time": 535,
                    "duration": 35,
                    "key_phrase": "QUE PORRADA",
                    "energy_level": 0.8,
                }
            ],
            cronista_clips=[
                {
                    "id": "arc_010",
                    "title": "Da tensão ao alívio",
                    "arc_type": "épico",
                    "total_duration": 62,
                    "segments": [
                        {"start_time": 480, "end_time": 498, "type": "content"},
                        {"start_time": 503, "end_time": 535, "type": "content"},
                    ],
                    "story_summary": "Mostra a tensão antes e a explosão depois do gol",
                }
            ],
            analista_clips=[],
        )

        self.assertEqual(len(deduped["garimpeiro"]), 0)
        self.assertEqual(len(deduped["cronista"]), 1)
        self.assertEqual(deduped["cronista"][0]["id"], "arc_010")
        self.assertEqual(len(dropped), 1)
        self.assertEqual(dropped[0]["source_clip_id"], "viral_010")


if __name__ == "__main__":
    unittest.main()