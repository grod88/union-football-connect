

## L5 — Admin Panel `/admin/bolinha`

### Changes

1. **Create `src/presentation/pages/site/AdminBolinha.tsx`**
   - Full admin panel with 4 sections: Manual Mode, AI Mode, Quick Actions, Preview (iframe), and History
   - Manual mode: textarea + 6 emotion buttons (with mini thumbnails from Supabase storage) + TTS checkbox + Send button (broadcasts directly via Realtime)
   - AI mode: textarea for context/prompt + TTS checkbox + Generate button (calls `bolinha-comment` edge function)
   - Quick actions: 9 preset buttons in a 3-column grid, each calls `bolinha-comment` with predefined prompts and `generate_audio: true`
   - Preview: iframe pointing to `/obs/bolinha?size=sm` with dark background container
   - History: fetches last 20 rows from `bolinha_messages`, listens for Realtime inserts to auto-update, displays time + emotion badge + truncated text
   - Dark theme styling: `bg-gray-950` page, `bg-gray-900 border-gray-800` cards, yellow send button, purple AI button
   - Emotion selector: grid of 6 with thumbnail images, selected gets `ring-2 ring-yellow-500`

2. **Update `src/config/routes.ts`** — add `ADMIN_BOLINHA: '/admin/bolinha'`

3. **Update `src/App.tsx`** — import `AdminBolinha` and add route

4. **Update `src/presentation/pages/site/index.ts`** — add export

### Technical notes
- Manual send: broadcast to channel `bolinha` event `comment`, then insert into `bolinha_messages` for history
- AI send: invoke `bolinha-comment` edge function which handles Claude generation, TTS, broadcast, and DB insert internally
- Quick actions use AI mode (invoke `bolinha-comment`) with `generate_audio: true`
- History uses `postgres_changes` Realtime subscription on `bolinha_messages` table for live updates
- No authentication required per user specification

