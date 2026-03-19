# Job Fair Registration Frontend

Next.js + TypeScript frontend for the job fair registration backend in `../be-project-68-pushenv`.

## Run locally

```bash
npm install
npm run dev
```

## Environment

Create `.env.local` from `.env.example` and point `NEXT_PUBLIC_API_URL` at the Express backend.

## Implemented flows

- Public landing page and company catalog
- Login and register flows
- User dashboard for interview bookings
- Admin dashboard for company and interview management

## Backend contract

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/logout`
- `GET /api/v1/companies`
- `GET /api/v1/companies/:id`
- `POST /api/v1/companies/:companyId/interviews`
- `POST /api/v1/interviews/bulk`
- `GET /api/v1/interviews`
- `PUT /api/v1/interviews/:id`
- `DELETE /api/v1/interviews/:id`

