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

| Variable              | Required | Description |
|-----------------------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No       | Base URL of the Express backend. If omitted, the app falls back to `http://localhost:5000` |

`.env.example` currently points to `http://localhost:3085`, which matches the local backend used in this project.

## Architecture
```
app/                        # Next.js App Router
  (auth)/                   # Login & register
  (protected)/              # Authenticated areas
    dashboard/              # User booking management
    admin/                  # Admin workspace
    admin/manage/           # Redirects to company management
  (public)/                 # Landing page & company catalog
    companies/[id]/         # Company detail page
lib/
  api.ts                    # All API calls plus response normalization
  types.ts                  # Shared TypeScript interfaces
  constants.ts              # Environment config, auth storage key, interview dates
  date.ts                   # Date formatting and interview date export
  utils.ts                  # Shared utility functions
components/
  auth-provider.tsx         # Auth context for login, register, logout, refresh
  shell.tsx                 # AppShell and top navigation
  guards.tsx                # ProtectedGate and role badge
  auth-forms.tsx            # Login/register forms
  company-catalog.tsx       # Public company list with debounced search
  company-detail.tsx        # Public company detail and booking flow
  dashboard-page.tsx        # User dashboard with overview, booking, reschedule, delete
  admin-workspace.tsx       # Admin workspace for bookings, companies, and users
  admin-page.tsx            # Admin quick-create booking page
  search-select-picker.tsx   # Searchable picker used in admin forms
  alert.tsx                 # Success/error alert component
  delete-button.tsx         # Inline confirmation delete button
  shadcn-ui.tsx             # Shared UI primitives
hooks/
  use-async.ts              # Generic async data fetching hook
  use-debounce.ts           # Debounce hook for search inputs
```

## Roles

| Role    | Permissions |
|---------|-------------|
| `user`  | Browse companies, book up to 3 interviews, reschedule or cancel own bookings |
| `admin` | Manage bookings, companies, and users; change user roles; book on behalf of users |

Admin accounts can be managed from the Admin Workspace. The backend also enforces role-based access on admin routes.

## Implemented flows

- Public landing page with summary cards and call-to-action
- Public company catalog with debounced search
- Public company detail page with booking state and interview history
- Login and register flows, with register always creating `user` accounts
- User dashboard with:
  - overview cards
  - single booking
  - multi-booking
  - rescheduling
  - cancellation
- Admin workspace with:
  - bookings section
  - company CRUD
  - user role management and deletion
- Admin quick-create booking page

Regular users are limited to 3 total interviews. The frontend also prevents multi-booking beyond the remaining quota.

## Backend contract

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET  /api/v1/auth/me`
- `GET  /api/v1/auth/logout`
- `GET  /api/v1/companies`
- `GET  /api/v1/companies/:id`
- `POST /api/v1/companies`
- `PUT  /api/v1/companies/:id`
- `DELETE /api/v1/companies/:id`
- `POST /api/v1/companies/:companyId/interviews`
- `POST /api/v1/interviews/bulk`
- `GET  /api/v1/interviews/slots`
- `GET  /api/v1/interviews`
- `GET  /api/v1/interviews/:id`
- `PUT  /api/v1/interviews/:id`
- `DELETE /api/v1/interviews/:id`
- `GET  /api/v1/users`
- `PUT  /api/v1/users/:id`
- `DELETE /api/v1/users/:id`

## Notes

- The frontend stores the auth token in localStorage under `jobfair.token`.
- If `NEXT_PUBLIC_API_URL` is not set, the app falls back to `http://localhost:5000`.
- Interview slots are fixed in code and also returned by the backend at `/api/v1/interviews/slots`.
