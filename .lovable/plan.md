

## Bolinha OBS Widget — Visual Upgrade

### 5 changes across 2 files

**1. `src/index.css`** — Replace existing Bolinha animations (lines 148-174) with the full set:
- Remove old `bolinhaFloat`, `bolinhaBounce`, `balloonIn` keyframes and classes
- Add new keyframes: `bolinhaFloat` (with rotation), `bolinhaBreath`, `bolinhaEnter`, `bolinhaGol`, `bolinhaBravo`, `bolinhaTedio`, `bolinhaSarcastico`, `bolinhaAnalise`, `balloonPop`, `balloonOut`, `cursorBlink`
- Add corresponding classes: `.bolinha-idle`, `.bolinha-enter`, `.bolinha-emotion-gol/bravo/tedio/sarcastico/analise`, `.balloon-enter`, `.balloon-exit`, `.typewriter-cursor`

**2. `src/presentation/pages/obs/ObsBolinha.tsx`** — Full rewrite of the component visual layer:
- Update `SIZE_MAP` to `{ sm: '200px', md: '300px', lg: '400px' }`
- Update `EMOTION_IMAGES` to use `-preview` suffixed filenames (background-removed versions)
- Add `TypewriterText` sub-component with cursor that hides when text completes
- Replace `isBouncing` state with `animClass` state (`'bolinha-idle'` default)
- Update `handleNewMessage`: set `bolinha-enter` → after 600ms set emotion-specific class → on reset set `bolinha-idle`
- Update `resetToIdle`: use `balloon-exit` class instead of opacity fade, then reset to idle
- Update layout: `paddingBottom: '10px'`, balloon `maxWidth: '420px'`, `fontSize: '19px'`
- Update `<img>` to use `animClass` and dynamic `filter` (gold glow when active, standard shadow when idle)
- Realtime subscription logic stays untouched

