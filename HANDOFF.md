# Handoff: Vue/Vite migration — MonthView done, next up ConfigView (#4f)

## 1. Goal

Migrating "Ponto & Folha" from a single-file vanilla-JS PWA (`legacy/index.html`) to Vue 3 + Vite + TS + Tailwind + Pinia + vue-router + vite-plugin-pwa, on branch `feat/vue-vite-migration` off `main`. Full plan: `C:\Users\IgorCamposMicadeiBue\.claude\plans\right-now-i-m-depoying-validated-pearl.md`.

**Work package #4e (MonthView) is DONE and manually verified.** This handoff hands off to work package #4f (ConfigView).

## 2. What #4e delivered

`src/views/MonthView.vue` now fully replaces legacy `renderMonth()` (index.html 1150-1382) + the `openDay` modal (1384-1440), **plus** the full `btnRelatorio` printed-report generator (1442-1581) — the user chose "Full view + report" scope for this task, not a stub.

New files:
- `src/lib/daySheet.ts` + `src/components/DaySheetHost.vue` — day editor (replaces `openDay`/`renderDmTasks`/`addPunchRow`/`dmSave`), plus a small "Adicionar dia" mini-sheet (replaces the legacy `prompt()` in `btnAddDay`).
- `src/lib/confSheet.ts` + `src/components/ConfSheetHost.vue` — two sheets: `numConfSheet` (single numeric value, backs `openConf`/`openFerConf`) and `xConfSheet` (desc+valor+tipo+excluir, backs `openConfX`). Also hosts the orchestration functions `openConf`, `openFerConf`, `openConfX`, `gerarConferencia`, `gerarConferenciaFerias` (mutate `folha.S`/`folha.getMonth()` directly — no new store mutators, matching the `ferias.ts` pattern).
- `src/lib/report.ts` (`abrirRelatorio(mk)`) — builds the same `window.open` + HTML-string + `window.print()` report as legacy `btnRelatorio`, using the existing `ask()` dialog (no new sheet needed — the question has no embedded input).
- `src/views/MonthView.vue` — composes all of the above: nav, alerts (`salFamAlert` — now exported from `engine.ts` as a pure function returning `{level,title,text}` instead of an HTML string — plus the closed-month message and the May/SinSaúde reminder), resumo-de-horas, day ledger (with the future-empty-day skip and the once-per-mount today-scroll), pagamentos avulsos, férias-in-month cards, 13º-in-month card, folha/conferência with `confDiffs`/`ferConfDiffs` divergence summaries and `confX` rows, fechar/reabrir mês.

Engine changes (`src/lib/engine.ts`):
- `FER_FIELDS`/`CONF_FIELDS` hoisted out of the `createEngine()` closure to **exported module-level consts**, typed via a new exported `FieldDescriptor<T>` interface. Confirmed safe before hoisting: their `app` closures only touch their own parameter, nothing engine-internal.
- New exported pure function `salFamAlert(c: MonthResult): SalFamAlert | null` (moved from legacy's HTML-returning `salFamAlert()`) — returns structured `{level,title,text}` so the view renders it without `v-html`.

`src/App.vue` now also mounts `<DaySheetHost />` and `<ConfSheetHost />` alongside the four existing hosts.

## 3. Verification done this session

- `npx vue-tsc --noEmit` — clean, zero errors, throughout (checked after each major addition, not just at the end).
- Manual browser pass via `npm run dev` + Playwright MCP, on `/mes`:
  - Day editor: opened a day, added two punches (08:00/17:00), added a pontual task, saved — resumo/day-chip/worked-hours all updated correctly (8h worked, 9h expected, -1h saldo, matching auto-lunch-deduction math).
  - Pagamento avulso: added "Plantão extra" R$300 tributável — appeared in the pagamentos list AND flowed into the "Adicionais" folha line (R$300,00), confirming the engine recompute chain.
  - Reconciliation (`openConf`): filled "Salário base" holerite value, saved — "Holerite: R$ 1.878,14 ✓ confere" sub-line rendered.
  - `openConfX`: created "Vale transporte" R$50 débito → appeared in folha as "− R$ 50,00 · só no holerite" and in the divergence summary; reopened it, confirmed pre-filled edit values (desc/valor/tipo), deleted it — removed cleanly. **Caught and fixed a bug here**: the "new verba" placeholder originally defaulted `v` to `0`, which pre-filled the value input with "0" instead of blank (legacy defaults to `''`). Fixed by using `v: NaN` as the "new" sentinel and `isFinite(x.v) ? String(x.v) : ''` in the sheet opener.
  - Month close/reopen: closed the month → alert banner appeared, pagamentos inputs and "+ Verba do holerite" disabled, clicking a day showed the closed-guard toast instead of opening the editor; reopened via the `confirmS` dialog → state restored.
  - Report: clicked "Gerar relatório" → `ask()` dialog ("Com atividades"/"Sem atividades") → new tab opened with the full report, values cross-checked against the on-screen resumo/folha (8h/9h/-1h, R$1.878,14 salário, R$300 adicional, R$8,54 falta debit, "✓ confere" line) — all matched.
  - Add-day mini-sheet: opened, entered day 28, "Abrir dia" correctly delegated into the day editor for `<mk>-28`.
  - Console: zero Vue warnings throughout; only a harmless `favicon.ico` 404.
  - Not exercised live (no programmed férias in the test data): the férias-card path (`openFerConf`/`gerarConferenciaFerias`). Low risk — it's the same `numConfSheet`/`gerarConferencia`-shaped code already verified for the monthly holerite case, just parametrized over `f.conf` instead of `m.conf`.

## 4. Immediate next step — work package #4f: ConfigView

`src/views/ConfigView.vue` is still the 11-line placeholder. This is the other large remaining view — legacy `#view-config` (index.html ~337 onward) covers: vigência (salary/rules versioning) CRUD, contrato (nome/admissão), salário/jornada/escala, batidas/almoço, extras/DSR, IR/dependentes/salário-família/cesta/ferCat, filhos editor (already have `FilhosEditor.vue` component per repo listing — reuse it), backup export/import, theme. Read legacy index.html from ~337 through the `btnSaveCfg` handler (search for `cSalario`/`vigNew`/`fileImport` to find the full range) before starting, the same way this session re-read 1150-1581 before touching MonthView.

Before starting #4f: skim `src/stores/folha.ts` (`exportBackup`/`importBackup`, `S.vig` shape) and `src/stores/types.ts` (`Vigencia`, `Cfg`, `DEFCFG`) again since a session boundary has passed.

## 5. Decisions and rejected approaches (still in effect)

- **Component library (Vuetify/PrimeVue) rejected** — bespoke Tailwind styling from DESIGN.md tokens.
- **Native browser dialogs (`prompt()`, embedded-`<input>` `ask()`) rejected** — every such legacy call site is now a dedicated reactive-singleton sheet + Host (ferias.ts/taskSheet.ts/daySheet.ts/confSheet.ts pattern). `dialog.ts`'s `ask()` stays title/body/buttons-only — do not add form-input support to it.
- **Store stays mutation-free of UI orchestration** — `folha.ts` still only has punch/undoPunch/toggleT/addFilho/delFilho/fetchFeriados/exportBackup/importBackup. All pags/conf/confX/month-close mutation and all day-editor mutation happens in `lib/*.ts` (confSheet.ts, daySheet.ts), same as `ferias.ts`/`tasks.ts` already did.
- **`FER_FIELDS`/`CONF_FIELDS` are now exported** from `engine.ts` (was undecided going into #4e) — this is done, don't redo it.

## 6. Relevant files

- `src/views/MonthView.vue` — done this session; reference for the next view's structure (now-tick pattern, `folha.activeMK`-style focused-item state, sheets wired via imports from `lib/*.ts`).
- `src/lib/daySheet.ts`, `src/lib/confSheet.ts`, `src/lib/report.ts` + their Host components — done this session, not expected to need further touches for #4f.
- `src/lib/engine.ts` — `FER_FIELDS`/`CONF_FIELDS`/`FieldDescriptor`/`salFamAlert` now exported at module scope; everything else unchanged.
- `src/views/ConfigView.vue` — **target of the next task; still an 11-line placeholder.**
- `legacy/index.html` from ~337 (`#view-config`) through the `btnSaveCfg` click handler — source of truth for #4f, not yet re-read this session boundary.
- `src/components/FilhosEditor.vue` — already exists, likely reusable as-is inside ConfigView.
- No uncommitted-beyond-scaffold state changed re: git — nothing has been committed on `feat/vue-vite-migration` yet. **Do not commit/push unless the user explicitly asks.**

## 7. Gotchas (still in effect)

- **Write-after-Read requirement:** Read a `.vue`/`.ts` file immediately before Writing it, even if read earlier in the session.
- **Commit/push policy:** Never commit or push unless the user explicitly asks.
- **Data-continuity constraint:** `LSKEY = 'pontofolha_v1'` and `load()`'s migration in `src/stores/folha.ts` must stay byte-for-byte equivalent to legacy — don't touch unless required, and if touched, preserve behavior exactly.
- **Financial parity is the top QA risk** for the whole migration — port math verbatim, don't "improve" it mid-port. (ConfigView is lower-risk here since it mostly edits `Cfg`/`Vigencia` fields rather than computing money, but the `DEFCFG` shape and `Vigencia` sort/lookup logic (`cfgFor`) must stay intact.)
- **`npx vue-tsc --noEmit` after each meaningful change**, not just at the end — this session caught nothing wrong, but it's cheap and fast (~1-2s) with this codebase size.
