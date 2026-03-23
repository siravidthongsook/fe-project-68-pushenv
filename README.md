# Job Fair Registration Frontend

Next.js + TypeScript frontend for the job fair registration backend in `../be-project-68-pushenv`.

## Run locally
```bash
npm install
npm run dev
```

## Environment variables

Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
```

| Variable                    | Required | Description                              |
|-----------------------------|----------|------------------------------------------|
| `NEXT_PUBLIC_API_URL`       | Yes      | Base URL of the Express backend          |

## Architecture
```
app/                        # Next.js App Router
  (auth)/                   # Login & register — no auth required
  (protected)/              # Dashboard & admin — requires authentication
    dashboard/              # User booking management
    admin/                  # Admin company & interview management
  (public)/                 # Landing page & company catalog — public
lib/
  api.ts                    # All API calls, centralized request helper
  types.ts                  # Shared TypeScript interfaces
  constants.ts              # Environment config and interview dates
  date.ts                   # Date formatting and interview date export
  utils.ts                  # Shared utility functions (cn, interviewCompanyName)
components/
  auth-provider.tsx         # Auth context — login, register, logout, session
  shell.tsx                 # Layout shells (SiteShell, ProtectedShell, AuthShell)
  guards.tsx                # ProtectedGate — redirects unauthenticated users
  alert.tsx                 # Success/error alert component
  delete-button.tsx         # Inline confirmation delete button
  shadcn-ui.tsx             # Custom UI primitives (Button, Input, Panel, etc.)
hooks/
  use-async.ts              # Generic async data fetching hook
  use-debounce.ts           # Debounce hook for search inputs
```

## Roles

| Role    | Permissions                                        |
|---------|----------------------------------------------------|
| `user`  | Browse companies, book up to 3 interviews          |
| `admin` | CRUD companies, view and edit all bookings         |

Admin accounts are promoted directly via the database — see backend README.

## Implemented flows

- Public landing page and company catalog with debounced search
- Login and register flows (role always defaults to `user`)
- User dashboard for managing interview bookings (max 3)
- Admin dashboard for company and interview management

## Backend contract

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET  /api/v1/auth/me`
- `GET  /api/v1/auth/logout`
- `GET  /api/v1/companies`
- `GET  /api/v1/companies/:id`
- `POST /api/v1/companies/:companyId/interviews`
- `POST /api/v1/interviews/bulk`
- `GET  /api/v1/interviews`
- `PUT  /api/v1/interviews/:id`
- `DELETE /api/v1/interviews/:id`