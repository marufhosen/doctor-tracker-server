# Doctor Tracker Server

Production-oriented REST API for administering doctors, their patients, and dashboard analytics. It is built with Bun, strict TypeScript, Express 5, Mongoose, and MongoDB.

## Features

- Cookie-based login with short-lived JWT access tokens.
- Cryptographically random opaque refresh tokens with rotation and reuse detection.
- Remember Me sessions, absolute session lifetimes, revocation, and idempotent logout.
- Role-based authorization for doctor and patient mutations.
- Doctor and patient search, filters, stable sorting, and bounded pagination.
- Patient ownership validation for nested doctor routes.
- Dashboard totals, patients-per-doctor aggregation, and UTC date trends.
- Strict Zod request and environment validation.
- CSRF protection, rate limiting, Helmet, CORS, secure cookies, anti-caching headers, and redacted structured logs.
- Graceful startup and shutdown with validated MongoDB connectivity.

The complete endpoint reference is in [docs/API.md](./docs/API.md).

## Requirements

- [Bun](https://bun.sh/) 1.3 or newer
- MongoDB 7 or newer, or a MongoDB Atlas cluster

## Installation

```bash
git clone <repository-url>
cd doctor-tracker-server
bun install --frozen-lockfile
cp .env.example .env
```

Replace every placeholder in `.env`, then create the initial administrator:

```bash
bun run seed:admin
bun run seed:data
```

Both seed commands are idempotent. The data seed adds 12 doctors and 48 patients without
duplicating or modifying records created by an earlier run.

Start development with file watching:

```bash
bun run dev
```

Start without file watching:

```bash
bun run start
```

The default health endpoint is `GET http://localhost:5000/api/v1/health`.

## Environment configuration

Configuration is validated before the server connects to MongoDB. Invalid or missing required values stop startup without exposing secret contents.

| Variable                    | Required/default        | Purpose                                          |
| --------------------------- | ----------------------- | ------------------------------------------------ |
| `NODE_ENV`                  | `development`           | `development`, `test`, or `production`           |
| `LOG_LEVEL`                 | `info`                  | Pino log level                                   |
| `PORT`                      | `5000`                  | HTTP listening port                              |
| `TRUST_PROXY`               | `0`                     | Number of trusted reverse proxies                |
| `REQUEST_BODY_LIMIT`        | `100kb`                 | JSON and form body limit                         |
| `MONGODB_URI`               | Required                | MongoDB or Atlas connection URI                  |
| `CORS_ORIGIN`               | Required                | Exact trusted browser origin                     |
| `JWT_ACCESS_SECRET`         | Required                | Access-token secret, at least 32 characters      |
| `JWT_ISSUER`                | `doctor-tracker`        | Required JWT issuer claim                        |
| `JWT_AUDIENCE`              | `doctor-tracker-client` | Required JWT audience claim                      |
| `ACCESS_TOKEN_TTL`          | `15m`                   | Access-token lifetime                            |
| `REFRESH_TOKEN_TTL`         | `24h`                   | Standard refresh lifetime                        |
| `REMEMBER_ME_TTL`           | `30d`                   | Remember Me absolute lifetime                    |
| `COOKIE_SECURE`             | `false`                 | Force HTTPS-only cookies outside production      |
| `COOKIE_SAME_SITE`          | `lax`                   | `strict`, `lax`, or `none`; `none` forces Secure |
| `RATE_LIMIT_WINDOW_MS`      | `60000`                 | General API rate-limit window                    |
| `RATE_LIMIT_MAX`            | `100`                   | General requests per window and client IP        |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `60000`                 | Login and refresh rate-limit window              |
| `LOGIN_RATE_LIMIT_MAX`      | `5`                     | Login attempts per auth window and client IP     |
| `REFRESH_RATE_LIMIT_MAX`    | `10`                    | Refresh attempts per auth window and client IP   |
| `ADMIN_NAME`                | Required                | Initial administrator name                       |
| `ADMIN_EMAIL`               | Required                | Initial administrator email                      |
| `ADMIN_PASSWORD`            | Required                | Initial password, at least 12 characters         |

Generate a secret locally, for example:

```bash
openssl rand -base64 48
```

Never commit `.env` or use production credentials in tests. `DATABASE_URL` is accepted as a compatibility fallback when `MONGODB_URI` is absent, but `MONGODB_URI` is preferred.

## Architecture

```text
src/
├── app.ts                 Express middleware and route composition
├── server.ts              Database startup and graceful shutdown
├── config/                Environment, database, cookies, CORS, logging
├── middlewares/           Authentication, authorization, CSRF, validation
├── modules/
│   ├── auth/              Login endpoints and password/session policy
│   ├── users/             Users and administrator bootstrap
│   ├── sessions/          Active sessions and refresh-token history
│   ├── doctors/           Doctor model, validation, services, and routes
│   ├── patients/          Patient model, validation, services, and routes
│   └── dashboard/         Counts and aggregation analytics
├── tests/
│   ├── unit/              Model, validation, utility, and service tests
│   └── integration/       HTTP middleware and route contract tests
└── utils/                 Errors, JWTs, opaque tokens, and pagination
```

HTTP concerns stay in controllers, business rules in services, persistence definitions in Mongoose models, and untrusted request contracts in Zod schemas. Service dependency injection keeps route and business tests deterministic without requiring a live database.

## Technical decisions

### Authentication

Access tokens are signed HS256 JWTs containing validated MongoDB user and session IDs, role, issuer, audience, issued-at, and expiration claims. They are short-lived and accepted only while their database session and user remain active.

Refresh tokens contain 384 bits of randomness and are stored only as SHA-256 hashes. Rotation uses a MongoDB transaction to atomically consume the current hash, replace it, and record the consumed token. Reuse of a consumed token revokes the entire token family.

Tokens are delivered only through scoped cookies. Unsafe browser requests require an exact trusted origin and a 256-bit double-submit CSRF token. Authentication and API responses are marked `no-store`.

### Data model and queries

Each patient belongs to exactly one doctor. Text indexes support bounded search and compound indexes cover common ownership, filter, date, and stable-sort patterns. List reads use lean documents, bounded page sizes, and deterministic `_id` tie-breaking.

Dashboard data is calculated from doctor and patient collections with counting queries and aggregation pipelines. No duplicate analytics collection is maintained.

### Operational safety

Structured logs redact passwords, cookies, authorization headers, CSRF headers, and token fields. Error responses use stable codes and never return production stack traces. Database URIs and secret values are not logged.

## Commands

| Command                | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `bun run dev`          | Start with file watching                         |
| `bun run start`        | Start the server                                 |
| `bun run seed:admin`   | Idempotently create the configured administrator |
| `bun run seed:data`    | Idempotently create sample doctors and patients  |
| `bun run typecheck`    | Run strict TypeScript checks                     |
| `bun run lint`         | Run ESLint                                       |
| `bun run lint:fix`     | Apply safe ESLint fixes                          |
| `bun run format`       | Format the repository with Prettier              |
| `bun run format:check` | Verify formatting                                |
| `bun test`             | Run all unit and integration tests               |
| `bun run test:watch`   | Run tests in watch mode                          |

Before submitting or deploying, run:

```bash
bun run typecheck
bun run lint
bun run format:check
bun test
```

Tests use synthetic configuration and service doubles. Never point a test process at a production database.

## Deployment

1. Provision MongoDB with network access limited to the application environment and a least-privilege database user.
2. Install dependencies with `bun install --frozen-lockfile`.
3. Set `NODE_ENV=production`, a strong unique JWT secret, an HTTPS `CORS_ORIGIN`, and production database credentials through the platform's secret manager.
4. Set `COOKIE_SECURE=true`. Use `COOKIE_SAME_SITE=none` only when the browser client is cross-site and HTTPS is guaranteed.
5. Set `TRUST_PROXY` to the exact number of trusted proxies so IP-based rate limiting cannot be spoofed.
6. Provision the indexes declared in the Mongoose schemas before directing traffic. Automatic index creation is intentionally disabled in production.
7. Run `bun run seed:admin` once with a strong initial password, then start with `bun run start`.
8. Configure the platform to send `SIGTERM` and allow enough time for HTTP shutdown and MongoDB disconnection.
9. Monitor the health endpoint and structured logs without collecting redacted secrets.

The built-in rate limiter uses process memory. A single instance is supported as configured; multiple instances require a shared `express-rate-limit` store before horizontal scaling.

## Scope

This API intentionally excludes appointments, prescriptions, billing, medical records, public registration, password recovery, email verification, and notifications. Doctor update and deletion are also outside the approved product scope.
