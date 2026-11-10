# Doctor Tracker Server — Agent Instructions

## Scope

Build the Doctor Tracker backend incrementally with Bun, strict TypeScript, Express 5, Mongoose, and MongoDB. Follow `TASKS.md` in order and do not implement features from later tasks early.

## Workflow

1. Before each task, inspect `git status`, the latest commit, and `TASKS.md`.
2. Confirm the task is not already implemented.
3. Keep the change limited to one roadmap task and preserve unrelated work.
4. Add relevant tests when the testing foundation exists.
5. Run typecheck, lint, formatting checks, and relevant tests when configured.
6. Update `TASKS.md`, inspect the diff, and create one Conventional Commit using the roadmap's required message.
7. Never commit secrets or environment files containing real values.

## Architecture

- Keep HTTP concerns in controllers and business logic in services.
- Keep persistence in Mongoose models and request contracts in Zod schemas.
- Keep cross-cutting behavior in middleware and reusable helpers in `src/utils`.
- Services must not depend on Express request or response objects.
- Prefer explicit types, avoid `any`, circular dependencies, speculative abstractions, and unrelated refactors.
- Use ESM imports compatible with the project's `NodeNext` TypeScript configuration.

## Security and data

- Never log or expose passwords, tokens, cookies, or complete database connection strings.
- Never store raw access or refresh tokens.
- Validate all untrusted request data and ObjectIds before database operations.
- Do not add public registration or functionality outside the approved roadmap.
- Never run destructive tests against a production database.

## Tooling

- Use Bun for dependency management, scripts, and tests.
- Do not introduce npm, pnpm, Yarn, Vitest, or unrelated infrastructure.
- Keep `bun.lock` committed and `.env` files ignored.
