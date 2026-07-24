# Ponto & Folha — Design System Migration

**Date:** 2026-07-24
**Source system:** `.claude/DESIGN.md` (Figma marketing-site design analysis)
**Scope:** Visual re-skin of `index.html` (single-file PWA), `manifest.json` theme colors, `sw.js` cache version. No HTML structure or JS logic changes beyond markup needed for pill/color-block shapes.

## Context

Ponto & Folha is a dense, mobile-first Brazilian time-tracking + payroll PWA, currently styled with a warm-gray/orange palette, `border-radius:0` everywhere, 2px hard borders, and Archivo type. The target design system (`DESIGN.md`) documents a *marketing site* language: monochrome black/white chrome, oversized pastel "color-block" sections, pill CTAs, `rounded.lg` cards, and fine-weight Inter-substitute type with mono used only for taxonomy labels.

**Fidelity approach (user-selected): Adapt the system.** Keep the app's dense mobile ergonomics and existing component structure; re-skin using the documented tokens; use color-blocks as accents at app-appropriate scale (not full marketing-poster scale) rather than applying the spec literally or doing a tokens-only swap.

Two categories of controlled deviation from `DESIGN.md`, both justified by gaps the doc itself flags:

1. **Dark mode** — `DESIGN.md` explicitly lists this as a "Known Gap" and names its own closest analog (`color-block-section-navy` + inverse-canvas footer). The app currently ships dark mode (`data-theme=dark`/`sys`), so dark mode must be preserved. We derive it using the doc's own analog rather than inventing an unrelated palette.
2. **Numeric/mono usage** — `DESIGN.md`'s "Don't put figmaMono in body copy" rule targets marketing prose. This app uses mono for tabular financial/time data (clock, punch stamps, currency, hour totals) — a ledger convention, not paragraph text. Mono stays on numeric data; section headers move to the documented **eyebrow** style instead.
3. **Missing semantic colors** — `DESIGN.md` has no error/destructive/pending-warning token (also a flagged gap: "Form-field error and validation styling is not visible"). The app needs these for payroll discrepancies and destructive actions. We keep the app's existing warn/error hues but re-tune them into the pastel family's saturation/lightness range rather than introducing unrelated colors.

## Token Mapping

### Colors (light)

| Current var | New value | Source token |
|---|---|---|
| `--ink` | `#000000` | `colors.ink` |
| `--bg` | `#ffffff` | `colors.canvas` |
| `--card` | `#ffffff` + 1px `#e6e6e6` border | `colors.canvas` + `colors.hairline` |
| `--ink-soft` | `#6b6b6b` | derived (mid-gray for `ink-soft` role; doc has no mid-gray token but implicitly needs one for secondary text — closest doc-safe choice is a low-emphasis gray consistent with hairline/hairline-soft family) |
| `--line` | `#e6e6e6` / `#f1f1f1` | `colors.hairline` / `colors.hairline-soft` |
| primary CTA (`--teal`) | split: `#000000` for real actions | `colors.primary` / `button-primary` |
| brand/punch accent | `#ff3d8b` (single-shot use only: lever grip, punch stamp) | `colors.accent-magenta` |
| `--green` (positive/abonado) | `#1ea64a` tint `#e9f7ee` | `colors.semantic-success` |
| `--red` (error/falta/destructive) | solid `#c62828`, tint `#fdecea` | extension, tuned to sit near `block-coral`/`block-pink` saturation |
| `--amber` (pending) | solid `#a66a1f`, tint `#f5ecd8` | reuses `block-cream` family as the tint base (documented token), solid is an extension |
| home punch-card block | `#dceeb1` | `colors.block-lime` |
| férias card block | `#c5b0f4` | `colors.block-lilac` |
| chip: feriado | tint `#efd4d4` | `colors.block-pink` |
| chip: férias | tint `#c5b0f4` @ low opacity | `colors.block-lilac` |
| chip: fechado (closed) | `colors.ink` / `colors.canvas` (inverse) | `chip.fechado` unchanged semantics |
| surface-soft (icon buttons, task tiles) | `#f7f7f5` | `colors.surface-soft` |
| overlay scrim | `rgba(0,0,0,.6)` | `colors.overlay-scrim` |

### Colors (dark — extension per Known Gap)

Derived by inverting ink/canvas and darkening pastels ~30%, per the doc's own stated analog:

| Role | Value |
|---|---|
| `--ink` (dark) | `#f2f2f2` |
| `--bg` / canvas (dark) | `#121212` |
| `--card` (dark) | `#1c1c1c` + `#333` hairline |
| `--ink-soft` (dark) | `#9a9a9a` |
| block-lime (dark) | `#3c4a26` (darkened, desaturated) |
| block-lilac (dark) | `#3a3050` |
| block-navy | unchanged `#1f1d3d` (already dark-native per doc) |
| accent-magenta | unchanged `#ff3d8b` (reads fine on dark) |
| error/warn/success tints (dark) | darkened equivalents, e.g. success tint `#1f3126`, error tint `#3a2420`, warn tint `#3a2f18` (these mirror the *current app's* existing dark-mode tint values, which already follow this exact pattern) |

### Typography

| Role | Current | New |
|---|---|---|
| Sans (`--disp`, `--body`) | Archivo | **Inter** (documented figmaSans substitute) |
| Mono (`--mono`) | Archivo | **JetBrains Mono** (documented figmaMono substitute) |
| Section labels (h2: "TAREFAS", "ESTE MÊS") | Archivo 800 15px uppercase | `typography.eyebrow` (JetBrains Mono, uppercase, 0.54px tracking) — deviation-justified reuse of doc's taxonomy-label role |
| Card/list body text | Archivo 500 | `typography.body` / `typography.body-sm` (Inter 320–330) |
| Numeric/time/currency (clock, punch stamps, hours, money) | Archivo mono-style | JetBrains Mono, kept — ledger-data exception (see Context) |
| Wordmark "Ponto&Folha" | Archivo 800 19px | Inter 700 ~19px, tight tracking, magenta ampersand (unchanged treatment, new palette) |
| Financial totals ("Líquido") | Archivo 800 | Inter 700 (within doc's allowed weight set) |
| Buttons | Archivo 800 14px | `typography.button` (Inter 480, 20px scaled down proportionally for mobile chrome — see Responsive note) |

### Shape & Elevation

| Element | Current | New |
|---|---|---|
| Cards (`.card`) | `border-radius:0`, solid `--card` fill, no border | `rounded.lg` (24px), `colors.canvas` fill, 1px `hairline` border — elevation level 1 |
| Buttons (all `.btn` variants) | `border-radius:0` | `rounded.pill` — true pill, matches `button-primary`/`button-secondary`/`button-tertiary-text` |
| Icon buttons (task edit/delete, theme toggle) | square/flat | `rounded.full` circle, `surface-soft` background — matches `button-icon-circular` |
| Chips (feriado/férias/abonado/falta/pend/task/rec) | `border-radius:0` rectangles | `rounded.full` pills |
| Inputs/selects | `border-radius:0` | `rounded.md` (8px) |
| Modal sheets (`.sheet`) | square top corners | rounded top corners (`rounded.xl`) |
| Toast | `border-radius:0` | `rounded.pill` |
| Bottom nav | flat bar, 2px top border | `colors.canvas` bg, 1px hairline top border (was 2px solid ink — softened to match doc's elevation-1 language) |
| Punch lever housing | square, 2px ink border | kept square + bordered — this is a mechanical-lever *affordance*, deliberately exempted from the pill/rounded rule the same way DESIGN.md exempts FigJam's sticky-note motifs from its own monochrome rule |

## Color-Block Usage (signature move, applied narrowly)

Per DESIGN.md's own rule ("never combine more than one color block visible inside a single viewport"), color-blocks are used in exactly two places, chosen for semantic fit:

1. **Home — punch card** (today's clock + lever): `block-lime`. Rationale: the one screen opened every day; matches the doc's pattern of using a block for the primary "hero" interaction.
2. **Jornada tab — Férias card**: `block-lilac`. Rationale: direct semantic echo — lilac is literally DESIGN.md's vacation/time-off hero color on the real `/design/` page.

Everything else (tasks list, month ledger, payroll breakdown, config forms) stays on white canvas with hairline borders — these are dense data/entry screens where a pastel fill would hurt legibility and where DESIGN.md itself reserves blocks for "story," not tabular data.

## Component-Specific Notes

- **Punch lever**: interaction unchanged. Recolor grip fill to `accent-magenta` (single-shot promo use, matches doc's reserved use of magenta). Keep the rotated punch-time "stamp" look — DESIGN.md explicitly endorses this kind of off-axis sticky-note flourish (FigJam thumbnails) as a brand signal to preserve, not flatten.
- **Bottom nav**: active tab gets a small black pill behind the icon+label, echoing `pricing-tab-selected`'s documented rule ("selected = primary surface").
- **Chips**: rectangular → pill-shaped, recolored into the block-tint pairs above.
- **Printed report window** (separate inline `<style>` inside the `window.open` document in `btnRelatorio` handler): swap Archivo → Inter, recolor to ink/hairline palette, keep pos/neg green/red for scannability. Its plain editorial table layout already matches "confident black-and-white paper."
- **`manifest.json`**: `background_color`/`theme_color` → `#ffffff` (was `#f3f2f2`); dark-mode meta `theme-color` in `index.html` → `#121212` (was `#201e1d`).
- **`sw.js`**: bump `CACHE` version string (e.g. `pontofolha-v13`) so the new CSS/fonts ship past the cache-first strategy. No logic changes.
- **Google Fonts**: replace the Archivo `<link>` with Inter + JetBrains Mono; `sw.js`'s opportunistic Google Fonts caching logic needs no change (host-based, not filename-based).

## Out of Scope

- No changes to app logic, state shape, calculations, or view structure.
- No new views or components.
- No changes to the onboarding flow's content or steps, only its visual treatment.

## Verification Plan

Since this is a pure front-end re-skin with no test suite, verification is manual in-browser:
1. Serve the app locally and visually check each of the 6 views (onboarding, home, tasks, jornada, month, config) in light and dark mode.
2. Exercise the punch lever, chip rendering (need a day with feriado/férias/falta states), modals (day editor, task editor, ask dialogs), and the printed report window.
3. Confirm no `border-radius:0` or Archivo references remain via a quick grep.
4. Confirm the service worker cache version changed and the app still loads offline after a reload.
