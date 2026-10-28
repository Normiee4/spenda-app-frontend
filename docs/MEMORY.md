# Spenda — Project Memory

Last updated: 2026-10-28

## What this is

Spenda is an offline-first Expo/React Native expense logger. The V1 loop is:
write expense lines in a notes-style pad, parse each line, gate on category,
save all valid lines at once, then edit or swipe-delete today's entries.

Canonical requirements: `docs/PRD.md`.

## Current status

**V1 frontend implementation is complete; real-device acceptance is still pending.**

Implemented:

- Three-step onboarding (welcome, pain point, format demo) with Back, Skip,
  scrollable body, step semantics, and persisted completion.
- Log screen: multi-line note pad, live parse preview, newline category gate,
  category chips, undo/redo, save, edit mode, today's list, swipe-delete with
  undo snackbar.
- History tab: Week / Month / All scopes, sticky date dividers, scope totals,
  collapsible read-only day cards.
- Profile group: hub, Account, Preferences, Theme, Settings, Logout.
- Light / Dark / System themes with persisted choice and themed status bar.
- Local SQLite expenses (integer centavos) and AsyncStorage prefs.
- Loading skeletons and empty/error states.
- Parser and history unit tests.

Verification completed:

- `npx tsc --noEmit` — passes.
- `npx expo lint` — passes.
- `npm test -- --runInBand` — 36/36 tests pass.
- `npx expo-doctor` — 20/21 checks pass.

Not yet done:

- No real-device or simulator visual/interaction pass.
- No end-to-end keyboard, safe-area, and accessibility test on device.
- `expo-doctor` reports patch-level SDK mismatches: expected `expo`
  57.0.31 / `expo-constants` 57.0.22 / `expo-linking` 57.0.13 /
  `expo-router` 57.0.29; installed 57.0.26 / 57.0.20 / 57.0.11 / 57.0.24.
  These were left unchanged deliberately to avoid unrelated upgrade churn.

## Latest resolution — frontend audit gaps (2026-10-28)

The audit found the V1 requirements were visible, but several UX, semantic,
and accessibility gaps remained. All were addressed:

- **Theme + status bar:** `app.json` now uses `userInterfaceStyle: "automatic"`;
  `expo-system-ui` added; root renders a themed `StatusBar` matching the
  in-app palette.
- **Onboarding:** added Skip on steps 0–1, made content scrollable, added a
  header role to the title, and raised Back/Skip targets to 44pt.
- **Log validation:** persistent format hint; flagged-line summary for
  multiple blocked lines; Save disabled while any line is blocked; selected
  category chips expose `accessibilityState`; bottom padding reacts to the
  keyboard.
- **Touch + interaction:** Save/Undo/Redo/chips/toggles/snack actions/edit
  cancel now meet 44pt targets; TodayList deletes on a single swipe opening;
  the inline `- Category` suffix is hidden when the meta row already shows it.
- **Contrast:** light `accent` and `warning` darkened to `#B85A3E`
  (white text ≈4.6:1); light `textFaint` is `#646B69` (≈4.9:1 on background);
  dark `textFaint` is `#84908B` (≈5.7:1 on background).
- **Errors and copy:** History shows a load-error empty state; Log's today-list
  refresh shows an error toast instead of silently emptying; logout copy now
  correctly says only profile/onboarding reset, while theme and expenses stay.
- **Dependencies:** installed `expo-system-ui` and the `expo-font` peer
  required by `@expo/vector-icons`. The initial `expo-font` install hit an
  npm peer conflict; the lockfile was synced with
  `npm install --package-lock-only --legacy-peer-deps`.

## Decisions and intentional deviations

- Tabs are temporarily **Log · History · Profile**. The approved final order is
  **Log · Report · History · Profile**; Report and intensity are deferred.
- History is an extra tab beyond the PRD's V1 two-tab layout. It is read-only
  and currently supports Week/Month/All.
- History day cards are collapsed by default, showing total, top three
  categories, and the first two entries plus `… +N more`; tap to expand.
- No mock expenses are seeded. `DEFAULT_PROFILE` is blank; onboarding demo
  copy is retained only as instructional content.
- Save uses the solid primary style.
- No global state library and no chart dependency.
- Backend is explicitly out of V1. The PRD's future sync item notes an
  Express + Postgres + Prisma direction, with local data remaining the source
  of truth and sync additive.

## Git state

- This folder is already a Git repository.
- Branch: `main`.
- Remote: **none configured**.
- History: a single commit, `aab1ec4 Initial commit`.
- Current frontend work is not committed: `src/`, `docs/`, `test/`, `styles/`,
  ESLint/TS config are untracked; `app.json` and package files are modified;
  the old `App.js` / `index.js` entries are deleted.

Before connecting a remote, review and commit the current working tree.

## Next work

1. Run the app on a real device or simulator and verify the V1 done criteria:
   keyboard/safe areas, onboarding, save/edit/delete/undo, history expansion,
   theme switching and persistence.
2. Decide whether to align the four Expo patch versions, then rerun
   `expo-doctor`.
3. Create/connect the Git remote and make an initial project commit.
4. Decide backend scope before building it: V1 is local-only; the planned
   future direction is optional account sync (Express + Postgres + Prisma).

## Key files

- `src/app/(home)/Log.tsx` — main logging screen.
- `src/components/log/NotePad.tsx` — note pad and undo/redo.
- `src/components/log/TodayList.tsx` — today's entries and swipe-delete.
- `src/app/(home)/History.tsx` — history scopes and list.
- `src/components/history/HistoryDayCard.tsx` — collapsible day card.
- `src/lib/parse.ts` — line parser and newline gate rules.
- `src/lib/db.ts` — SQLite schema and CRUD.
- `src/lib/prefs.ts` — AsyncStorage profile/theme/onboarding prefs.
- `src/constants/theme.ts` — palettes and design tokens.
- `app.json` — Expo config.

## Commands

```bash
npx expo start
npx tsc --noEmit
npx expo lint
npm test -- --runInBand
npx expo-doctor
```
