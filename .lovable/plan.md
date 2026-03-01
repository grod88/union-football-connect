

## Problem Analysis

Two issues found:

### 1. Edge function broadcast doesn't reach OBS
The `bolinha-comment` edge function (used by AI/quick action buttons) creates a Supabase channel and calls `.send()` **without subscribing first**. Supabase Realtime requires the channel to be subscribed before broadcasting. This means:
- **Manual sends** from admin work (admin subscribes to the channel on mount, line 153-154)
- **AI/quick action sends** via the edge function silently fail to broadcast — the message is saved to DB but never reaches the OBS widget

### 2. OBS relies solely on broadcast (fragile)
The OBS widget only listens for broadcast messages. If a broadcast is missed (network hiccup, race condition), the subtitle is lost forever.

## Fix

### A. Fix edge function broadcast (`supabase/functions/bolinha-comment/index.ts`)
Subscribe to the channel before sending, then clean up:

```typescript
// Current (broken):
await supabase.channel("bolinha").send({ ... });

// Fixed:
const channel = supabase.channel("bolinha");
await channel.subscribe();
await channel.send({ type: "broadcast", event: "comment", payload: { ... } });
await supabase.removeChannel(channel);
```

### B. Add fallback listener in OBS (`src/presentation/pages/obs/ObsBolinha.tsx`)
Subscribe to **both** broadcast AND `postgres_changes` on `bolinha_messages`. If a broadcast is missed, the DB insert still triggers the widget. The DB row doesn't have `audioBase64` inline, so the OBS will play without audio in the fallback case — but the subtitle and emotion will still appear.

Add a dedup mechanism (track last processed message ID) so the same message isn't played twice when both broadcast and DB trigger fire.

### C. Deploy the edge function
Redeploy `bolinha-comment` after the fix.

**Files changed**: `supabase/functions/bolinha-comment/index.ts`, `src/presentation/pages/obs/ObsBolinha.tsx`

