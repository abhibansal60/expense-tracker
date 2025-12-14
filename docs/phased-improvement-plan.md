# Phased Improvement Plan

This document tracks implementation of the previously proposed fixes and improvements across the UI and backend. Each phase lists scope, acceptance checks, and self-review notes ("LLM judge") recorded after completing the work.

## Phase 1: Navigation accessibility and consistency (UI)
- **Scope:** Unify navigation config for desktop/mobile shells, add clear aria labelling, and improve keyboard focus visibility while keeping all tracker views reachable.
- **Acceptance checks:**
  - Desktop and mobile navigation render from a shared source of truth with consistent labels/icons.
  - Buttons expose `aria-current` and remain focus-visible when tabbed.
  - Manual lint run documents any baseline issues.
- **Status:** ✅ Complete in this iteration.
- **LLM judge self-review:** Navigation config is centralized and reused; focus-visible styles added; lint run recorded with baseline warnings (no new regressions). Desktop and mobile nav now expose the import/bridge view alongside overview and activity to keep parity with available screens. Icon typing tightened to use `LucideIcon` to prevent regressions when swapping icons during future iterations.

## Phase 2: Privacy lock and theme preference consolidation (UI)
- **Scope:** Introduce shared hooks for inactivity lock and preferred theme persistence; expose lock state affordances in banners/navigation.
- **Acceptance checks:** Pending.
- **Status:** ⏳ Planned.
- **LLM judge self-review:** To be completed after implementation.

## Phase 3: Category aggregation performance (Backend)
- **Scope:** Batch category fetches and reuse in expense aggregation to reduce Convex read counts.
- **Acceptance checks:** Pending.
- **Status:** ⏳ Planned.
- **LLM judge self-review:** To be completed after implementation.

## Phase 4: Expense deduplication enforcement (Backend/UI)
- **Scope:** Enforce dedupe keys server-side and surface friendly errors in form/import flows.
- **Acceptance checks:** Pending.
- **Status:** ⏳ Planned.
- **LLM judge self-review:** To be completed after implementation.

## Phase 5: Household gate resilience (UI/Backend)
- **Scope:** Add error boundaries and better telemetry/error codes around household gating flows.
- **Acceptance checks:** Pending.
- **Status:** ⏳ Planned.
- **LLM judge self-review:** To be completed after implementation.

## Phase 6: CI lint/typecheck stability (Tooling)
- **Scope:** Reduce lint baseline noise and ensure `lint`/`build` run in CI.
- **Acceptance checks:** Pending.
- **Status:** ⏳ Planned.
- **LLM judge self-review:** To be completed after implementation.
