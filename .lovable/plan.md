

## Update bolinha-tts Voice Settings

Two changes in `supabase/functions/bolinha-tts/index.ts`:

1. **Voice settings** (lines 49-54): Update to new values:
   - `stability: 0.30` (was 0.40)
   - `similarity_boost: 0.65` (was 0.85)
   - `style: 0.45` (was 0.80)
   - `use_speaker_boost: true` (unchanged)

2. **Add speed parameter** in the request body alongside `voice_settings`:
   - `speed: 0.95`

No other files need changes. The function will be auto-deployed.

