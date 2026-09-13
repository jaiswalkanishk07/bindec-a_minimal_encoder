# Bindec — Work Plan (Roadmap)

Status snapshot of where **Bindec** is and what's left to do. Phases are ordered so each is
independently shippable — push to git after each one.

---

## ✅ Phase A — Correctness & hardening (DONE)

**Scope:** close the "all possible bugs" list in the original spec, cheap + high value.

| Item | Status |
|---|---|
| `SAME_BASE` error code actually thrown in `convert()`/`validate()` (was dead code) | Done |
| API: `/v1/meta`, `/v1/validate`, CORS allow/block, rate-limit tests | Done |
| CORS allowlist via `CORS_ORIGIN` env (default `http://localhost:5173`) | Done |
| `buildApp({ corsOrigin, rateMax })` configurable for tests | Done |
| PWA icons (`icon.svg`) + manifest `icons` array + favicon link | Done |
| Core tests **10/10**, API tests **10/10**, `vite build` ✓ | Done + live smoke-tested |

---

## ✅ Phase B — Web restructure (DONE)

**Goal:** split the 272-line `App.tsx` into the hierarchy from the original spec, with zero
behavior change.

- [x] `src/components/fx/Background.tsx` — aurora + grid layers
- [x] `src/features/convert/ConsoleCard.tsx` — base pickers, input, keypad, result, copy, swap
- [x] `src/features/bits/BitRail.tsx` — 8/16/32/64 width toggles + clickable bit cells (bumped to 40px thumb targets)
- [x] `src/features/explain/ExplainPanel.tsx` — staggered explain steps
- [x] `src/features/history/HistoryPanel.tsx` — localStorage recent list
- [x] `App.tsx` reduced to state container + composition; `ui.tsx` primitives wired (incl. `ReactNode` import fix)
- [x] Web **vitest parity suite** — `apps/web/tests/core.parity.test.ts` (6 tests), `test` script + vitest devDep, tsconfig includes `tests`
- [x] Root `npm test` runs all three workspaces
- [x] Bonus: clipboard fallback (textarea + exec) for older WebViews

**Verify:** core 10/10 ✓ · api 10/10 ✓ · web parity 6/6 ✓ · `vite build` ✓ (442 modules).

---

## ⏳ Phase C — Visual polish (NEXT)

**Goal:** keep the minimal dashboard, make motion smooth and tasteful, honor `prefers-reduced-motion`.

- [ ] Animate the aurora backdrop (slow CSS `@keyframes` drift, GPU `transform`/`opacity` only) instead of a static gradient; keep the static gradient as the reduced-motion fallback
- [ ] Swap button rotate spring (Framer Motion)
- [ ] Bit flip pop on toggle; consistent 180ms result reveal
- [ ] Thumb-size keypad targets finalized for mobile/safe-area

**Verify:** light build, contrast on both desktop + mobile widths, `prefers-reduced-motion` shows static bg.

---

## ⏳ Phase D — Docs & cleanup

- [ ] Update `README.md` to match final folder layout (mirrors `PROJECT.md`)
- [ ] Confirm no stray log/build artifacts (`dist/`, `*.log`) before commits
- [ ] Optional: promote `capacitor.config.json` → documented in README's "App later" section
- [ ] Final full pass: `npm test` + `npm run build` from clean clone

**Verify:** fresh `git status` shows only intended files.

---

## Out of scope (v1)
Accounts, cloud history, IEEE-754 inspector, bitwise ALU playground, fractions phase-2,
actual Play/App Store submission.

## Working notes
- Terminals default to **cmd** on this machine (no npm.ps1/PowerShell execution-policy issues).
- Vite may bind IPv6 only — use `http://[::1]:5173` if `localhost` fails.
- Stop dev servers: `taskkill /pid <api> /f` and `taskkill /pid <vite> /f`.