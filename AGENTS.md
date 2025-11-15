# Guidance for LLM contributors

## Project snapshot
- **Stack**: React 19 + TypeScript + Vite on the frontend, Convex for backend/data/auth, utility-first CSS in `src/index.css`.
- **Key directories**:
  - `src/` – client components, hooks, and styles (see `src/components` for UI building blocks).
  - `convex/` – Convex schema plus queries/mutations; generated client lives under `src/convex/_generated` (do not edit manually).
  - `public/` – static assets for Vite.
- **Auth**: Google OAuth via `@convex-dev/auth`. `AuthWrapper` gates the UI and must keep calling `api.users.syncCurrentUser` whenever a session is authenticated so Convex has a matching profile document.

## Coding conventions
- Prefer functional React components with hooks; colocate component-specific hooks/utilities next to the component file.
- Keep Convex server functions type-safe by importing from `./_generated/server` and validating arguments with `v` from `convex/values`.
- Never edit generated Convex files. Re-run `npx convex codegen` if typings fall out of sync.
- Stick to TypeScript strictness already configured (no implicit `any`, respect ESLint). If you must use `any`, document why and narrow the scope.
- For styles, use the utility classes defined in `src/index.css` before adding new CSS.

## Testing & tooling
- `npm run dev` – start Vite (requires Convex dev server running separately via `npx convex dev`).
- `npm run build` – type-check + production build.
- `npm run lint` – ESLint. **Note**: the current baseline has known failures (`@typescript-eslint/no-explicit-any` in `ExpenseForm`/`ExpenseList` and a React hooks warning in `InitialSetup`). Call out these pre-existing issues if they block the command.
- When writing new Convex functions, add schema updates to `convex/schema.ts` and regenerate types with `npx convex codegen`.

## Pull request expectations
- Include file-level citations referencing the touched files/line ranges when summarizing changes.
- Mention every manual test or script you ran (even if failing due to known baseline issues) and explain failures.
- If you modify UI that materially changes visuals, capture a screenshot via the provided browser tooling.

Following this guidance keeps the Convex client/server contract intact and ensures reviewers can quickly verify your work.
