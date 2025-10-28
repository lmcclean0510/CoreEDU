# Repository Guidelines

## Project Structure & Module Organization
CoreEDU is a Next.js 15 App Router workspace. Routes, layouts, and API handlers live under `src/app`, with feature-specific folders co-located beside their routes. Shared UI sits in `src/components`, hooks in `src/hooks`, and cross-cutting utilities (Firebase helpers, formatters, data fetchers) belong in `src/lib`. Context providers stay in `src/providers`, while Genkit and AI flows are collected in `src/ai`. Reference product briefs or QA notes in `docs/` before changing flows that users rely on.

## Build, Test, and Development Commands
- `npm run dev` — Turbopack dev server on port 9002 with hot reload.
- `npm run genkit:dev` / `npm run genkit:watch` — Spin up the Genkit emulator against `src/ai/dev.ts`.
- `npm run build` then `npm run start` — Production bundle and verification run.
- `npm run lint` — `next lint` with the TypeScript path alias `@/*`.
- `npm run typecheck` — Strict compiler pass; run it before every push.

## Coding Style & Naming Conventions
Keep everything in TypeScript with functional React components. Follow the prevailing two-space indent, opt into `PascalCase` for components/providers, `useSomething` for hooks, and `camelCase` for helpers. Prefer Tailwind utility classes over bespoke CSS; extend design tokens in `tailwind.config.ts` when new colors or spacing scale is needed. When pulling additional shadcn UI, update `components.json` so future syncs stay deterministic.

## Testing Guidelines
Automated coverage is minimal today—add targeted tests alongside the modules you touch (`Feature.test.tsx` sitting next to its source). Use Next’s recommended `@testing-library/react` plus `next/jest` when introducing suites, and document any new scripts in `package.json`. For Firestore or auth changes, exercise the Firebase emulators and capture steps or screenshots in the PR description.

## Commit & Pull Request Guidelines
History favors short, imperative messages (for example, `Update AddTasksStep.tsx`). Keep commits narrow in scope and rerun `npm run lint` plus `npm run typecheck` before pushing. PRs need a concise summary, bullet list of changes, linked issues, screenshots for UI shifts, and explicit verification steps or emulator commands. Flag schema, config, or environment variable updates so reviewers can reproduce locally without guesswork.

## Security & Configuration Tips
Never commit secrets; store local values in `.env.local` and cross-check teammates via secure sharing. If you modify Firebase rules, hosting config, or middleware, update the relevant files (`firestore.rules`, `apphosting.yaml`, `next.config.ts`) and note migrations in `docs/README.md`. Keep derived credentials out of the repo and clear them from build logs before attaching evidence to reviews.
