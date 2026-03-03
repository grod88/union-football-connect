

## Plan: "Proximas Lives" section with two match cards

### What changes

1. **Translations** (`src/i18n/translations.ts`): Change `nextMatch.title` from "Proximo Jogo" / "Next Match" to "Proximas Lives" / "Upcoming Lives"

2. **NextMatchSection** (`src/components/NextMatchSection.tsx`): Replace the single `<NextMatchCard />` with two hardcoded match cards side-by-side:
   - **Palmeiras vs Novorizontino** (Final do Paulista - Jogo 1) with link `https://youtube.com/live/SZNocJ9U6rU?feature=share`
   - **Sao Paulo vs Chapecoense** with link `https://youtube.com/live/hBuqQbI09qY?feature=share`

3. **NextMatchCard** (`src/presentation/components/match/NextMatchCard.tsx`): Add support for receiving a `fixture` prop directly (static data) instead of always fetching from the API via `useNextMatch`. This allows passing hardcoded match data for Palmeiras and Novorizontino.

### Approach

Rather than modifying the dynamic `NextMatchCard` heavily, the simplest approach is to build a new `UpcomingLivesSection` directly in `NextMatchSection.tsx` that renders two static match cards with:
- Team names and logos (fetched from constants or hardcoded with API-Football team IDs: Palmeiras=121, Novorizontino=???, Sao Paulo=126, Chapecoense=???)
- The specific YouTube links per match
- Countdown timers if match dates are known
- "Assistir Live" buttons pointing to the correct YouTube links

Since we need team logos and match dates, the best approach is to use two `NextMatchCard` instances with different `teamId` props and override the `youtubeLink`. The existing hook already supports custom `teamId`.

### Files modified
- `src/i18n/translations.ts` — title change
- `src/components/NextMatchSection.tsx` — render two `NextMatchCard` components:
  - `<NextMatchCard teamId={TEAMS.PALMEIRAS} youtubeLink="https://youtube.com/live/SZNocJ9U6rU?feature=share" />` 
  - `<NextMatchCard teamId={TEAMS.SAO_PAULO} youtubeLink="https://youtube.com/live/hBuqQbI09qY?feature=share" />`
- Layout: stack vertically with gap, or 2-column grid on desktop

