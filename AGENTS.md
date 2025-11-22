# Guidance for LLM contributors

These notes keep the React/Convex stack healthy and reduce review churn. The scope of this file is the entire repository.

## Project snapshot
- **Stack**: React 19 + TypeScript + Vite on the frontend; Convex handles data/auth. Styling favors the utility classes defined in `src/index.css`.
- **Key directories**:
  - `src/` – client components, hooks, and styles (UI primitives live under `src/components`).
  - `convex/` – Convex schema plus queries/mutations. The generated client lives in `src/convex/_generated` (never edit these files directly).
  - `public/` – static assets for Vite.
- **Auth**: Google OAuth via `@convex-dev/auth`. `AuthWrapper` must keep calling `api.users.syncCurrentUser` whenever a session is authenticated so Convex has a matching profile document.

## Coding conventions
- Favor functional React components and co-locate component-specific hooks/utilities with the component.
- Keep Convex server functions type-safe: import from `./_generated/server` and validate arguments with `v` from `convex/values`.
- Never edit generated Convex files. If typings drift, regenerate with `npx convex codegen`.
- Honor TypeScript strictness (no implicit `any`, respect ESLint). If you must use `any`, keep the scope tiny and justify it in comments.
- Prefer existing utility classes from `src/index.css` before introducing new CSS.
- Maintain accessibility by providing `aria` labels for interactive elements and ensuring focusable controls are keyboard navigable.
- Keep React side effects lean: use `useEffect` only when necessary, clean up subscriptions/timeouts, and avoid stale closures by listing all dependencies.
- Use descriptive naming for Convex functions and client hooks so intent is clear in both `convex/` and `src/convex/` usage.

## Testing & tooling
- `npm run dev` – start Vite (requires Convex dev server via `npx convex dev` running separately).
- `npm run build` – type-check + production build; run before merging when feasible.
- `npm run lint` – ESLint. The current baseline has known failures (`@typescript-eslint/no-explicit-any` in `ExpenseForm`/`ExpenseList` and a React hooks warning in `InitialSetup`). Call out these pre-existing issues if they block the command.
- When adding or changing Convex functions, update `convex/schema.ts` as needed and regenerate types with `npx convex codegen`.
- Prefer small, focused commits with descriptive messages; keep diffs minimal and scoped to the change set.

## Pull request expectations
- Include file-level citations referencing the touched files/line ranges when summarizing changes.
- Mention every manual test or script you ran (even if failing due to known baseline issues) and explain failures.
- If you modify UI visuals, capture a screenshot via the provided browser tooling and include it in the summary.
- Keep PR descriptions actionable: what changed, why, and any follow-up debt.

Following this guidance preserves the Convex client/server contract, keeps the UI consistent, and makes reviews fast.
