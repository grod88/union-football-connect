

## L5 — Floating Re-sync Button + Last Sync Timer

### Changes to `src/presentation/pages/site/AdminBolinha.tsx`

1. **Add `lastSyncAgo` state + 30s interval** that computes relative time from `matchContext.last_synced_at`, turning yellow when > 10 minutes
2. **Update `syncMatch`** to show a toast on success with score/events info from the response
3. **Add sync status bar** below the title showing "Ultimo sync: ha X minutos" with color logic
4. **Add floating FAB** at bottom-right: fixed round blue button calling `syncMatch`, only visible when `matchContext` exists
5. **Import `toast`** from `sonner` for success notification

### Edits
- Add `import { toast } from 'sonner'`
- New state: `const [syncAgo, setSyncAgo] = useState('')` + `const [syncStale, setSyncStale] = useState(false)`
- New `useEffect` with 30s `setInterval` computing relative time from `matchContext?.last_synced_at`
- Update `syncMatch` to call `toast()` after success with score/events summary
- After `</div>` (closing max-w-5xl), before closing `</div>`, add the floating button JSX
- Add sync-ago indicator in the title bar area

