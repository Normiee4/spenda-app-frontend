Spenda prd v2 · MD
Spenda: Product Requirements Document (V1)

Status: Final for V1 build. Supersedes prd v1. The input model is now a notes-style multi-line pad with inline categories (no keyword auto-categorization). Supersedes the earlier "Spenda/Spendy" PRD and the "Sevings" market research as the source of scope. Those documents now feed the Soon-to-Have list (Section 9).

1. Purpose

Spenda is a personal expense tracker built for myself and as a hands-on project for learning mobile app development (React Native + Expo). The goal is discipline with money: write expenses the way you jot notes — several in one sitting — then review spending habits later.

V1 is deliberately one feature done well: logging expenses fast, offline, in a note pad.

2. Problem

Budget and finance apps are rarely offline, and logging an expense takes too many taps and decisions: one entry at a time, pick a category from a menu, repeat. When logging is a chore, the habit dies. Spenda makes logging feel like writing notes — a running ledger where each line is an expense and the category is written inline.

3. V1 Scope

Expense Log (note pad) + lean onboarding + profile. One job: write lines like "45 Jeep - Commute", save them all at once.

In V1:

Notes-style multi-line text input (one line = one entry)
Inline category: each line ends with "- Category" (example: "Snack 20 - Food")
Newline gate: moving to the next line on a line that has an amount requires picking a category first
Live parse preview for the current line (amount + category)
Undo / redo controls on the pad (notes-app feel)
Today's entries list: daily total, tap to edit, swipe to delete with undo toast
Lean 3-screen onboarding (welcome → pain point → how the format works)
Two tabs: Log + Profile
Profile group: Account, Preferences, Theme, Settings, Logout
Functional theme: Light / Dark / System, persisted
Fully offline, local storage only

Not in V1 (see Section 9): calendar, wraps/charts, intensity, budgets, strict mode, Receiptify, Dashboard, Allocation, login/sync, monetization.

4. Product Principles

Logging must take under 5 seconds from app open.
Works with no network, always. There is no server dependency in V1.
One screen, one job. The Log screen is the home screen.
Writing a line should feel like a note, not a form. The category is part of the sentence, not a dropdown.
Any feature that does not make logging faster waits for later.

5. Functional Requirements

5.1 Log input (note pad)

Multi-line text field, auto-focused when the Log screen opens.
Each non-empty line is one entry. Format: <text> <amount> - <Category>. Amount position is flexible: "45 Jeep - Commute" and "Snack 20 - Food" are both valid.
Submit via a Save button pinned above the keyboard (not return — return inserts a newline).
Newline gate: pressing return on a line that contains a number but no valid category suffix does NOT insert a newline. The category picker opens instead; picking a chip appends " - Category" to that line, then the newline proceeds. A line with no number, or one that already carries a category, proceeds normally.
After saving: pad clears, entry count refreshes, today's list shows the new lines at the top.
Undo / redo buttons on the pad restore previous pad states (debounced snapshots), like a notes app.
Save is disabled when the pad is empty or contains no line with an amount.

5.2 Live parse preview

While typing, a preview line under the pad shows the parse of the line being edited: amount + category (example: "₱13 · Commute").
If an amount is found but no category yet: "₱13 · pick a category →" (the gate will demand it on return).
If no amount yet: a neutral hint, not an error. Errors appear on save only.

5.3 Category application

No keyword auto-categorization. Categories are never guessed (the keyword table in prd v1 is removed).
Two equivalent ways to set a category on a line:
Type it inline: the suffix after the last " - " must match a category name, case-insensitive ("commute", "Commute", "COMMUTE").
Pick it via the category chips when the gate opens (and chips may be tapped any time to append the suffix to the current line).
The 12 categories: commute, food, grocery, gas, utility, bills, loans, debt, shopping, drinks, leisure, other (fallback).
There is no "Auto" chip and no global category override. Every amount-bearing line must end in a category before it can be saved.

5.4 Today's entries list

Shows entries logged today, newest first, with raw text, amount, category, and time.
Daily total shown at the top of the list.
Swipe left to delete (with undo toast). Tap an entry to load its raw text into the pad in edit mode; saving updates that entry instead of creating a new one.
Empty state: "No expenses logged today."

5.5 Quick-add chips

Cut from V1. The pad itself is the quick path. May return as a Soon-to-Have convenience.

6. Line Parser (replaces keyword parser)

Parser rules, applied per line:

Trim the line; skip empty lines.
Category = everything after the last " - " if (and only if) it matches a category name case-insensitively. Otherwise the line has no category.
Amount = the first number in the remaining text. Support commas and decimals ("1,200" and "45.50").
Name = the remaining text with the amount removed, trimmed ("45 Jeep - Commute" → "Jeep"; "Snack 20 - Food" → "Snack").
On save: lines with no number are ignored (dropped silently — revisit after testing). Lines with a number but no valid category are excluded and highlighted in the pad (safety net; the newline gate makes this rare, e.g. paste).
Amount must be > 0 (Section 7).
Save { amount_centavos, category, raw_text, timestamp } per accepted line, all in one save action.

The category list lives in one constants file so it can be edited without touching parser logic. No keyword table exists.

7. Edge Cases

Scenario	Behavior
Line with no number	Ignored on save (dropped, pad keeps it until cleared). Revisit after testing.
Line with number, no/unknown category	Excluded on save and flagged inline in the pad. Normally unreachable thanks to the newline gate.
Empty pad / no line with an amount	Save button disabled.
Amount is zero or negative	Block save with a validation message.
Multiple numbers in a line	Use the first number found.
Very large amount	Accept, but ask for confirmation above a sensible threshold (example: over ₱100,000) to catch typos.
Mixed valid + invalid lines	Save button blocked until the flagged lines are fixed or their amounts removed (strict, predictable — one save action).
App killed mid-typing	Draft text is not required to persist in V1.
No network	No difference; nothing in V1 uses the network.

8. Technical Requirements

Platform: React Native + Expo (SDK 57 as installed in package.json; requires a development build or Expo Go with SDK 57 support), Expo Router, TypeScript.
Styling: StyleSheet + design tokens in src/constants/theme.ts, themed via a ThemeProvider (light/dark/system). No NativeWind in V1 (prd v1's NativeWind clause is retired; tailwind.config.js is not used).
Storage: expo-sqlite, local only. Full CRUD offline. Amounts stored as integer centavos to avoid floating point errors. Prefs (profile, theme mode, onboarding flag) in AsyncStorage.
Backend: None in V1.
State: Local component state plus a small data-access layer over SQLite and a theme context. No global state library.
Navigation: Root Stack with onboarding and the main screen. Main is a 2-tab layout: Log (landing after onboarding) + Profile. Profile is a nested stack group (profile-settings): hub → Account, Preferences, Theme, Settings, Logout.
Testing: Unit tests for the line parser (the one piece of real logic in V1) covering both example formats, case-insensitivity, comma/decimal amounts, and every edge case in Section 7.

Data model

Table	Fields
expenses	id, amount_centavos, category, raw_text, created_at, updated_at

Profile { name, email }, theme mode, and the onboarding flag live in AsyncStorage — there is no profile table.

9. Soon to Have (not in V1)

Ordered roughly by build priority. Each depends on V1's logging loop working first.

#	Feature	What it does	Depends on
1	Calendar and Wraps	Month calendar with per-day spend (future dates not selectable). Day / week / month wraps: total, entry count, average per day, days with spending, top category, heaviest day or entry. Charts by category, day, and calendar week.	Logged expenses
2	Intensity and habit watch	Current period vs previous equal period (heating up / steady / cooling down), plus repeat-label detection.	Wraps
3	Budget Allocator	Total budget with custom percentage splits (50/30/20, 70/20/10, or 4 buckets). Estimated daily and weekly limits per bucket.	Wraps, categories
4	Strict Mode	Hard per-bucket limits; logging that would exceed a bucket is blocked until reset.	Budget Allocator
5	Dashboard	Overview landing: totals, trends, quick links.	Logged expenses, Wraps
6	Allocation	Needs / wants / savings allocation view (50/30/20 buckets).	Strict Mode, Wraps
7	Receiptify	Receipt-style summaries for a day, week, or month, shareable or savable as an image.	Wraps
8	Editable categories and keywords	Custom categories; optional keyword auto-fill as a shortcut alongside inline categories.	V1 categories
9	Gmail login and device sync	Optional sign-in for syncing across devices. Local data stays the source of truth; sync is additive. Needs a backend (Express + Postgres + Prisma planned). Sign in with Apple must be offered alongside any third-party login on iOS.	Stable local schema
10	Monetization	Free core plus one-time or low annual unlock for advanced features (multi-bucket rules, longer history, Receiptify, export).	Features 3, 4, 7

From the market research (Sevings): competitor positioning, personas (Juan the commuter, Aya the saver, Mark the habit builder), TikTok-led go-to-market, and the paywall model are kept as reference for features 3, 4, 6, 7, and 10. They do not shape V1 scope.

10. V1 Done Criteria

Open app, write "45 Jeep - Commute" and "Snack 20 - Food" (second line gated until Food is picked), save: both entries appear in today's list in under 5 seconds.
Undo/redo on the pad restore previous text.
Tap an entry → edit in pad → save updates it. Swipe → delete → undo restores it.
Airplane mode: every V1 action works.
Force-close and reopen: entries, profile, theme choice, and onboarding completion all persist.
Parser unit tests pass for all Section 6 rules and Section 7 edge cases.
Onboarding shows on first launch only; Log screen is the landing screen afterwards.
Theme: Light/Dark/System selectable on Profile → Theme, applies live, survives restart.
Runs on a real phone via Expo Go (SDK 57) or a dev build with no layout problems from the keyboard or safe areas.
