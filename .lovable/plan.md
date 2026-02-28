

## L2 — Edge Function bolinha-tts

### Changes

1. **Create `supabase/functions/bolinha-tts/index.ts`** with the provided code, but with one fix: replace the `btoa` + spread approach for base64 encoding (causes stack overflow on large buffers) with Deno's `base64Encode` from std library.

2. **Update `supabase/config.toml`** to add `[functions.bolinha-tts]` with `verify_jwt = false`.

3. **Deploy** the function (automatic).

### Technical note

The user's provided code uses `btoa(new Uint8Array(...).reduce(...))` which can crash with large audio buffers. Will use `import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"` instead. Also updating CORS headers to include all required Supabase client headers.

Secrets `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are already configured.

