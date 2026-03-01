

## Bolinha OBS Widget — Legendas Estilo Filme + Animações Contínuas

### 2 changes across 2 files

**1. `src/index.css`** (lines 178-264)
- Change emotion animations from fixed repetition counts to `infinite`: `bolinha-emotion-gol` (3→infinite), `bolinha-emotion-bravo` (8→infinite), `bolinha-emotion-sarcastico` (3→infinite)
- Replace balloon and typewriter CSS with new subtitle system: `.subtitle-container` (fixed positioning, max 2 lines, overflow hidden), `.subtitle-fade-enter` (fade+slide animation), remove `.typewriter-cursor` and `.balloon-*` classes

**2. `src/presentation/pages/obs/ObsBolinha.tsx`** — Rewrite text display and timing logic:
- Remove `TypewriterText` component entirely
- Add `splitIntoSubtitles(text, maxCharsPerBlock=80)` function that splits text by sentences, respecting max char limit per block
- Replace balloon state (`messageText`, `balloonClass`) with subtitle state (`subtitleBlocks`, `currentBlockIndex`, `showSubtitle`)
- Add `blockIntervalRef` to track the subtitle cycling interval
- Rewrite `handleNewMessage`:
  - Split text into blocks via `splitIntoSubtitles`
  - Start cycling blocks with interval (3s per block without audio, or duration/blocks with audio)
  - Entry animation → emotion animation (infinite loop)
- Rewrite `resetToIdle` → `resetBolinha`: fade out subtitle, then after 400ms reset emotion to neutro + idle
- Audio: use `ended` event to trigger reset instead of `onloadedmetadata` timer; fallback timer based on `blocks.length * 3000 + 1000`
- Replace balloon JSX with fixed subtitle container above Bolinha: `key={currentBlockIndex}` forces re-render for fade animation, font 22px bold, max 2 lines via `-webkit-line-clamp: 2`

