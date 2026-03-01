

## Fix: Remove Ellipsis from Subtitles

The "..." appears because of `-webkit-line-clamp: 2` on line 236, which is a CSS property that truncates overflowing text with an ellipsis. Since `splitIntoSubtitles` already splits text into properly sized blocks, the clamp is unnecessary and actively harmful.

### Change in `src/presentation/pages/obs/ObsBolinha.tsx`

Remove the `-webkit-box` display and `-webkit-line-clamp` styles from the subtitle `<p>` element (lines 234-239). Replace with simple `max-width` and `word-wrap` to let the text flow naturally without truncation. The `splitIntoSubtitles` function already ensures each block fits within ~80 characters, so no clamping is needed.

