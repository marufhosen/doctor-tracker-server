# Doctor Tracker Server — Agent Guide

## Project brief

Doctor Tracker Server is the authoritative HTTP API for the Doctor Tracker admin
portal. It owns administrator authentication and sessions, role authorization,
doctors, patients, doctor/patient assignments, dashboard aggregations, validation,
persistence, and stable error responses.

The service must remain secure, predictable, typed, deployable to Vercel as a
serverless handler, and runnable locally with Bun. Do not add public registration,
password recovery, appointments, clinical records, or speculative features
without an explicit request and agreed API contract.

The sibling `doctor-tracker-client` consumes this API. This repository is the
source of truth for server behavior; documentation and the client must follow the
implemented and tested contract.

## Source of truth and repository boundaries

- Keep `src/**`, tests, `docs/API.md`, `docs/openapi.json`, `.env.example`, and the
  README consistent when a public contract or deployment requirement changes.
- The sibling client is read-only unless explicitly included in the request. Do
  not hide a breaking API change behind an unrequested client workaround.
- Preserve unrelated and pre-existing changes in both repositories.
- Never commit real environment values, credentials, database URLs, signing keys,
  tokens, or generated secrets.

## Current stack

- Bun for dependency management, scripts, local execution, and tests
- Express 5 with strict TypeScript and NodeNext-compatible ESM
- MongoDB with Mongoose; Zod for request and environment validation
- `jose` for JWTs and Argon2 for password hashing
- Helmet, CORS, cookie-parser, and rate limiting for HTTP protection
- Pino/Pino HTTP for structured logging
- ESLint and Prettier for code quality

Do not add another package manager, test runner, ORM, framework, logger, or
validation library without a demonstrated need and user approval. Keep `bun.lock`
committed.

## Architecture

- Keep application construction in `src/app.ts` and runtime entry/handler behavior
  in `src/server.ts`. Importing the serverless handler must not start a listener.
- Keep HTTP concerns in controllers, business rules in services, persistence in
  Mongoose models, and request contracts in Zod schemas.
- Services must not depend on Express `Request` or `Response` objects.
- Put cross-cutting request behavior in middleware and focused helpers in
  `src/utils` or the relevant module.
- Prefer explicit types and narrow interfaces. Avoid `any`, circular imports,
  speculative abstractions, hidden side effects, and unrelated refactors.
- Use ESM imports compatible with `NodeNext`. Handle CommonJS interop explicitly
  instead of applying unsafe casts.
- Reuse database connections across serverless invocations. Avoid module-import
  behavior that makes health checks or cold starts fail needlessly.
- Keep liveness checks lightweight and truthful. Do not imply database readiness
  unless readiness is actually verified.

## API contract

- Version public routes under `/api/v1` and preserve established response/error
  envelopes unless a deliberate versioned change is requested.
- Core modules cover health, auth, doctors, patients, assignments, and dashboard
  summaries/trends. Do not invent endpoints for client convenience.
- Validate params, query strings, headers, cookies, request bodies, and ObjectIds
  before use.
- Use intentional status codes and stable machine-readable error codes. Return
  safe messages; never expose stacks, database internals, raw validation details,
  or regular expressions.
- Pagination, search, sorting, filters, and date ranges need bounded defaults and
  deterministic ordering. Avoid unbounded collection reads.
- Dashboard data must come from persistence and scale through aggregation,
  ranking, or bounded series—not fake or client-specific data.
- Contract changes require aligned schemas, implementation, focused tests,
  OpenAPI, API documentation, and examples.

## Authentication and security invariants

- Store only Argon2 password hashes. Never log or return passwords, hashes,
  tokens, cookies, authorization headers, CSRF secrets, or full database URLs.
- Access tokens are short-lived signed JWTs. Refresh credentials are opaque,
  stored hashed, bound to server sessions, and rotated under the session policy.
- Refresh rotation must preserve absolute session lifetime. Detect invalid,
  expired, revoked, and replayed credentials and revoke the affected session or
  family according to existing policy.
- Auth cookies remain HttpOnly, Secure in production, correctly scoped, and use
  the configured SameSite policy. Cookie and token/session expiry must agree;
  Remember Me controls the approved persistence window.
- State-changing cookie-authenticated requests require established Origin and
  double-submit CSRF checks. Configure exact trusted origins rather than weakening
  CSRF or CORS.
- Enforce authentication and role authorization on every protected route. Client
  redirects are never an authorization control.
- Apply appropriate rate limits and security headers. Do not disable protections
  globally to fix one environment.
- Use library-provided cryptographic verification. Do not create custom crypto,
  token formats, or insecure fallback secrets.
- Redact sensitive values from structured logs and errors while retaining safe
  diagnostic context.

## Data and persistence

- Maintain indexes for uniqueness, session lookup, filtering, sorting, and common
  aggregation paths. Enforce real uniqueness in the database.
- Normalize and validate boundary data. Convert duplicate-key and cast failures
  into stable API errors.
- For assignments, validate both records, prevent duplicate relationships, and
  define removal/deletion effects explicitly.
- Use atomic operations or transactions when an invariant spans multiple writes.
  Do not report success before all required persistence succeeds.
- Never run destructive tests, migrations, cleanup, or seeding against production.
- `seed:admin` and `seed:data` are explicit, idempotent operator commands. Never
  auto-seed during startup or deployment.

## Runtime and deployment

- Local development may listen on the configured port. Vercel must invoke the
  exported Express handler without calling `listen()`.
- Do not depend on persistent writable disk, process-local session state, or a
  single long-lived instance; serverless invocations are concurrent and ephemeral.
- Validate required environment variables at startup with useful safe errors.
  Keep `.env.example` and deployment docs current without real values.
- Production CORS, cookies, trusted origins, MongoDB network access, and deployed
  client/server URLs form one aligned deployment contract.

## Testing and error handling

- Add focused unit tests for policies and integration tests for affected routes,
  middleware, cookies, authorization, validation, persistence, and envelopes.
- Use the established isolated test architecture; never point tests at production.
- Cover success and meaningful failures, especially malformed input,
  unauthenticated/forbidden access, duplicates, missing records, refresh rotation,
  replay, CSRF, and database failures.
- Central error handling must respond consistently, avoid sending headers twice,
  and log unexpected failures once with redaction.

## Working agreement

1. Read this file and any more specific `AGENTS.md` that applies.
2. Inspect `git status`, relevant recent commits, and the files involved. Consult
   `TASKS.md` for history, but its old phased workflow does not override the
   user's current request.
3. Confirm existing behavior and contract impact before editing.
4. Make the smallest coherent change, preserve unrelated work, and update focused
   tests and public docs for externally visible behavior.
5. Run proportionate checks, inspect the diff, and report checks not completed.
6. Commit only when requested or explicitly required by the active task. Use a
   short Conventional Commit and stage only related files.

Never commit `.env` files, credentials, tokens, generated secrets, or unrelated
changes. Do not rewrite user work merely to clean the working tree.

## Verification commands

Use the smallest relevant set, expanding for higher-risk changes:

```bash
bun test <relevant-test-file>
bun run typecheck
bun run lint
bun run format:check
```

For deployment changes, also verify the production import/build path or equivalent
Vercel execution path. A change is complete when contracts, security and
persistence invariants, tests, and public documentation agree.
