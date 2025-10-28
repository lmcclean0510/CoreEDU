# Repository Guidelines

## Project Structure & Module Organization
CoreEDU is a Next.js 15 App Router project. Routes, layouts, and API handlers stay in `src/app`, reusable UI in `src/components`, shared hooks in `src/hooks`, Firebase/session helpers in `src/lib`, and context providers in `src/providers`. AI and Genkit workflows live in `src/ai`. Product notes and QA scripts are under `docs/`. Repo-level configuration (`next.config.ts`, `tailwind.config.ts`, `firestore.rules`, `components.json`) should be updated alongside any structural change. Co-locate new feature folders with their owning route to keep discovery simple.

## Build, Test, and Development Commands
- `npm run dev` — Launches the Turbopack dev server on port 9002.
- `npm run genkit:dev` / `npm run genkit:watch` — Starts the Genkit emulator pointed at `src/ai/dev.ts`; use when iterating on AI flows.
- `npm run build` → `npm run start` — Production build and serve.
- `npm run lint` — ESLint via `next lint`; resolves path aliases out of `tsconfig.json`.
- `npm run typecheck` — Strict TypeScript check; run before every PR.

## Coding Style & Naming Conventions
Stick with TypeScript, functional React components, and the prevailing 2-space indentation. Components and providers are `PascalCase`, hooks start with `use`, utilities are `camelCase`, and route folders stay lowercase. Rely on Tailwind classes; extend design tokens in `tailwind.config.ts` rather than hard-coding colors. Sync any new shadcn pieces through `components.json`, and run `npm run lint` until the tree is clean.

## Testing Guidelines
The repo currently lacks automated coverage—add it as you touch code. Place new specs as `*.test.ts` or `*.test.tsx` alongside the source, favor React Testing Library for UI, and use Firebase emulators for Firestore logic. Until an end-to-end suite exists, record manual flows with the checklist in `docs/CONSISTENCY_UPDATE.md` and summarize results in your PR.

## Commit & Pull Request Guidelines
History favors short, imperative commit subjects (e.g., “Update SeatingPlanTool.tsx”); keep that style and scope commits narrowly. Before pushing, run lint and typecheck. PRs should supply a concise summary, bullet-pointed changes, linked issues, UI screenshots when visuals shift, and explicit verification steps or command output. Call out schema or config updates so teammates can reproduce them locally.

## Security & Configuration Tips
Store secrets only in `.env.local` and sample them in docs when onboarding others. If you adjust Firebase rules, middleware, or hosting configs, update `firestore.rules` and note required emulator commands. Document any new environment variables in `docs/README.md` so future agents can boot the feature set without guesswork.
