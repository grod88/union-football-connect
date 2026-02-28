

## L4 — Widget OBS `/obs/bolinha`

### Key Discovery
The 6 Bolinha images are in the **Supabase storage bucket** `bolinha-images`, not in `public/bolinha/`. The widget will reference them via the storage public URL: `${SUPABASE_URL}/storage/v1/object/public/bolinha-images/bolinha-{emotion}.png`.

### Changes

1. **Create `src/presentation/pages/obs/ObsBolinha.tsx`**
   - Full widget component with:
     - Emotion-to-image mapping using Supabase storage URLs
     - Supabase Realtime subscription on channel `bolinha`, event `comment`
     - Idle state: neutro image with CSS float animation (translateY oscillation, 3s loop)
     - On message: crossfade image (300ms), bounce animation (scale 0.8→1.12→1.0), speech balloon with triangle pointer, auto-play audio
     - Auto-dismiss after 8s (or audio end, whichever is longer), then fade balloon and return to neutro
     - URL params: `?size=sm|md|lg` (140px / 200px / 280px)
     - Preload all 6 images on mount
     - Uses `OBSLayout` wrapper (transparent background, same as other OBS widgets)

2. **Update `src/presentation/pages/obs/index.ts`** — add `ObsBolinha` export

3. **Update `src/config/routes.ts`** — add `OBS_BOLINHA: '/obs/bolinha'`

4. **Update `src/App.tsx`** — add route `<Route path={ROUTES.OBS_BOLINHA} element={<ObsBolinha />} />`

5. **Add CSS keyframes** to `src/index.css`:
   - `bolinhaFloat` (translateY 0→-8px, 3s loop)
   - `bolinhaBounce` (scale 0.8→1.12→1.0, 0.5s)
   - `balloonIn` (scale 0 + translateY → scale 1, 0.4s with spring easing)

### Technical notes
- Audio playback: `new Audio(audioBase64)` where `audioBase64` is the data URI from the broadcast payload
- Timer management: clear previous timeout on new message arrival to avoid race conditions
- Storage URL pattern: `https://wnnyfgtvgnfvkqmyftti.supabase.co/storage/v1/object/public/bolinha-images/bolinha-neutro.png` (will use `VITE_SUPABASE_URL` env var)

