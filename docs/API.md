# Doctor Tracker REST API

Base URL: `/api/v1`

All request and response bodies use JSON unless noted otherwise. Dates are ISO 8601 timestamps. MongoDB identifiers are 24-character hexadecimal strings.

## Authentication and CSRF

Login sets three cookies:

- `doctor_tracker_access`: HTTP-only access token, scoped to `/api/v1`.
- `doctor_tracker_refresh`: HTTP-only opaque refresh token, scoped to `/api/v1/auth`.
- `doctor_tracker_csrf`: readable CSRF token, scoped to `/api/v1`.

The client must send cookies with requests. Every unsafe request (`POST`, `PATCH`, `PUT`, or `DELETE`) must also:

1. originate from the configured `CORS_ORIGIN`;
2. copy the `doctor_tracker_csrf` cookie value into the `X-CSRF-Token` header.

Login requires a trusted `Origin` header but is exempt from the token header because no CSRF cookie exists yet. All doctor, patient, and dashboard routes require authentication. Mutating doctor and patient routes require the `ADMIN` role.

### Login

`POST /auth/login`

```json
{
  "email": "admin@example.com",
  "password": "a-secure-password",
  "rememberMe": true
}
```

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "671000000000000000000001",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

Tokens are only returned as cookies and never appear in the JSON response. `rememberMe` defaults to `false`.

### Refresh session

`POST /auth/refresh`

Requires the refresh cookie and CSRF protection. The refresh token is rotated on every successful request and reused tokens revoke their token family.

### Current user

`GET /auth/me`

Returns the currently authenticated user without password or token data.

### Logout

`POST /auth/logout`

Revokes the current session when a valid refresh cookie is present and always clears authentication cookies. The operation is safe to repeat.

## Doctors

| Method   | Endpoint                                 | Role          | Description                                      |
| -------- | ---------------------------------------- | ------------- | ------------------------------------------------ |
| `GET`    | `/doctors`                               | Authenticated | List, search, filter, sort, and paginate doctors |
| `GET`    | `/doctors/:id`                           | Authenticated | Get doctor details                               |
| `POST`   | `/doctors`                               | `ADMIN`       | Create a doctor                                  |
| `GET`    | `/doctors/:doctorId/patients`            | Authenticated | List a doctor's patients                         |
| `POST`   | `/doctors/:doctorId/patients`            | `ADMIN`       | Create a patient for a doctor                    |
| `DELETE` | `/doctors/:doctorId/patients/:patientId` | `ADMIN`       | Delete a patient belonging to a doctor           |

### Create doctor

```json
{
  "name": "Dr. Samira Khan",
  "specialization": "Cardiology",
  "hospital": "City Hospital",
  "phone": "+880 1712-345678",
  "email": "samira@example.com"
}
```

Returns `201 Created` with the created doctor in `data.doctor`.

### List doctors

`GET /doctors?page=1&limit=10&search=samira&specialization=Cardiology&sortBy=createdAt&sortOrder=desc`

Query parameters:

| Parameter                  | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| `search`                   | Full-text search across name, specialization, hospital, and email |
| `specialization`           | Exact specialization filter                                       |
| `hospital`                 | Exact hospital filter                                             |
| `createdFrom`, `createdTo` | Inclusive creation timestamp range                                |
| `page`                     | Positive page number; defaults to `1`                             |
| `limit`                    | Page size from `1` to `100`; defaults to `10`                     |
| `sortBy`                   | `name`, `specialization`, `hospital`, or `createdAt`              |
| `sortOrder`                | `asc` or `desc`                                                   |

```json
{
  "success": true,
  "message": "Doctors retrieved successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

## Patients

| Method   | Endpoint        | Role          | Description                                       |
| -------- | --------------- | ------------- | ------------------------------------------------- |
| `GET`    | `/patients`     | Authenticated | List, search, filter, sort, and paginate patients |
| `GET`    | `/patients/:id` | Authenticated | Get patient details                               |
| `PATCH`  | `/patients/:id` | `ADMIN`       | Update patient fields                             |
| `DELETE` | `/patients/:id` | `ADMIN`       | Delete a patient                                  |

### Create patient under a doctor

`POST /doctors/:doctorId/patients`

```json
{
  "name": "Rahim Ahmed",
  "condition": "Hypertension",
  "phone": "+880 1712-345678",
  "email": "rahim@example.com",
  "age": 42,
  "gender": "MALE",
  "address": "Dhaka"
}
```

`name` and `condition` are required. `gender` accepts `MALE`, `FEMALE`, or `OTHER`. The doctor is taken from the URL and cannot be assigned through the body.

### List patients

`GET /patients?page=1&limit=10&doctorId=671000000000000000000002&condition=Hypertension&sortBy=createdAt&sortOrder=desc`

The doctor-specific listing supports the same parameters except `doctorId`.

| Parameter                  | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `search`                   | Full-text search across name, email, and phone |
| `doctorId`                 | Exact doctor filter on the global listing      |
| `condition`                | Exact condition filter                         |
| `createdFrom`, `createdTo` | Inclusive creation timestamp range             |
| `page`                     | Positive page number; defaults to `1`          |
| `limit`                    | Page size from `1` to `100`; defaults to `10`  |
| `sortBy`                   | `name`, `condition`, `age`, or `createdAt`     |
| `sortOrder`                | `asc` or `desc`                                |

### Update patient

`PATCH /patients/:id`

Send at least one patient field. `doctorId` is not editable.

```json
{
  "condition": "Recovered",
  "phone": "+880 1812-345678"
}
```

Both deletion endpoints return `200 OK` with `data: null`. The nested endpoint returns `404` when the patient does not belong to the specified doctor.

## Dashboard

| Method | Endpoint                        | Description                                           |
| ------ | ------------------------------- | ----------------------------------------------------- |
| `GET`  | `/dashboard/summary`            | Total doctor and patient counts                       |
| `GET`  | `/dashboard/patients-by-doctor` | Patient counts for every doctor, including zero       |
| `GET`  | `/dashboard/trends`             | Doctor and patient creation counts grouped by UTC day |

### Summary response

```json
{
  "success": true,
  "message": "Dashboard summary retrieved successfully",
  "data": {
    "summary": {
      "totalDoctors": 12,
      "totalPatients": 84
    }
  }
}
```

### Trends

`GET /dashboard/trends?from=2026-01-01T00:00:00.000Z&to=2026-01-31T23:59:59.999Z`

`from` and `to` are optional inclusive timestamps. If both are supplied, `from` must not be later than `to`.

```json
{
  "success": true,
  "message": "Dashboard trends retrieved successfully",
  "data": {
    "trends": {
      "doctors": [{ "date": "2026-01-03", "count": 2 }],
      "patients": [{ "date": "2026-01-03", "count": 7 }]
    }
  }
}
```

## Health and errors

`GET /health` is public and returns service health without querying MongoDB.

Errors use a consistent envelope:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

Common status codes are `400` for invalid input, `401` for invalid authentication, `403` for authorization or CSRF failures, `404` for missing resources, `429` for rate limits, and `500` for unexpected server errors.
