

## L6 — Test Results and Required Fixes

### Test Results

| Test | Status | Issue |
|------|--------|-------|
| Widget OBS (`/obs/bolinha`) | FAIL | Images return 404 — the `bolinha-images` storage bucket exists but is **empty**. No PNG files have been uploaded. |
| Admin panel (`/admin/bolinha`) | PARTIAL | Page renders correctly. Emotion thumbnails also broken (same 404 images). |
| TTS (`bolinha-tts`) | PASS | Edge function works — returns base64 audio successfully. |
| IA (`bolinha-comment`) | PASS | Edge function works — Claude generates text + emotion correctly. TTS internal call also works. |
| Audio playback in widget | BUG | Double data-URI prefix: `bolinha-tts` returns `data:audio/mpeg;base64,...` but `ObsBolinha.tsx` wraps it again with `data:audio/mpeg;base64,${msg.audioBase64}`, producing an invalid URL. |
| Realtime broadcast | PASS | `bolinha-comment` broadcasts successfully (log confirms REST fallback). |
| History (postgres_changes) | NEEDS CHECK | Table exists with correct schema. Realtime publication may need enabling. |

### Required Fixes

1. **Fix audio double-prefix in `ObsBolinha.tsx`** (line 78)
   - Current: `new Audio(\`data:audio/mpeg;base64,${msg.audioBase64}\`)`
   - Fix: `new Audio(msg.audioBase64)` — since TTS already returns the full data URI

2. **Enable realtime for `bolinha_messages` table**
   - Run SQL migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.bolinha_messages;`
   - Required for the History section's `postgres_changes` subscription in AdminBolinha

3. **User action required: Upload the 6 Bolinha images** to the `bolinha-images` storage bucket
   - The bucket exists and is public, but contains no files
   - Required filenames: `bolinha-neutro.png`, `bolinha-gol.png`, `bolinha-bravo.png`, `bolinha-analise.png`, `bolinha-sarcastico.png`, `bolinha-tedio.png`
   - This must be done manually by the user through the backend storage interface

### Technical Details

- The `bolinha-tts` edge function returns `audioBase64` with value `"data:audio/mpeg;base64,SUQzBAA..."` (full data URI)
- The `bolinha-comment` function passes this value through to the Realtime broadcast payload as-is
- `ObsBolinha.tsx` then wraps it again, creating `"data:audio/mpeg;base64,data:audio/mpeg;base64,SUQzBAA..."` which is invalid
- All secrets (ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID) are configured and working

