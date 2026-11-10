# Doctor Tracker Server

Backend REST API for the Doctor Tracker administrative application. The project uses Bun, Express, TypeScript, Mongoose, and MongoDB.

## Prerequisites

- [Bun](https://bun.sh/) 1.3 or newer
- MongoDB (used by later development tasks)

## Setup

Install the dependencies:

```bash
bun install
```

Copy `.env.example` to `.env` and replace every placeholder with a local value. Use a cryptographically random JWT secret of at least 32 characters. Environment configuration is validated when the application starts.

Run the development server with file watching:

```bash
bun run dev
```

Run the server without file watching:

```bash
bun run start
```

Create the initial administrator from the validated `ADMIN_*` environment variables:

```bash
bun run seed:admin
```

The command is idempotent and will not replace or elevate an existing account.

Check the TypeScript project:

```bash
bun run typecheck
```

Run the test suite:

```bash
bun test
```

Tests use synthetic configuration and must use an isolated test database when persistence coverage is introduced. Never point tests at a production database.

Rate limiting uses an in-memory store by default, which is suitable only for a single application instance. Configure an appropriate shared rate-limit store before running multiple production instances.

## Project structure

Application source belongs in `src/`. Operational scripts will live in `scripts/` as they are introduced. Features, configuration, middleware, shared types, and tests will be added incrementally according to [TASKS.md](./TASKS.md).

Environment files and dependencies are intentionally excluded from version control. The Bun lockfile is committed to keep dependency installation reproducible.
