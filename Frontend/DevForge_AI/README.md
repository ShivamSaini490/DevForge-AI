# DevForge AI frontend

Implementation of **days 1–5** of the supplied *Frontend 30 Days Plan* (PDF pages 9–13), retaining the existing React + TypeScript + Vite project.

## Run locally

Use Node.js 22.12+ (verified with Node 24) and npm.

```powershell
cd Frontend/DevForge_AI
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open the local URL printed by Vite. A local, git-ignored `.env.local` is already prepared for development demo mode.

**Demo login:** `demo@devforge.ai` / `DevForge123!`. You can also register a sample account and sign out/in within the same page session. This is an explicit development fixture, not real authentication. Accounts and sessions live in memory and reset on refresh; use sample details only. No credentials or tokens are persisted in browser storage. Production builds always use the API and exclude the demo module.

## Delivered scope

| Day | Implementation |
| --- | --- |
| 1 | Existing Vite/TypeScript setup, BrowserRouter, Zustand, folder structure, environment template, global styles |
| 2 | Primary/secondary/danger/ghost buttons, loading/disabled states, input/textarea/select, native dialog modal, loader, empty state, six status badges, focus and label accessibility |
| 3 | AppShell, responsive sidebar, topbar, PageHeader, required routes, recent tasks navigation, safe 404 |
| 4 | Login page and form, required-field/email validation, password visibility, pending/error states, Enter submission |
| 5 | Register/confirm-password validation, typed auth service, shared auth state, session initialization, protected routes, return to requested route, logout |

The dashboard is a foundation welcome screen. Projects, project details, task creation/execution, and settings expose their reserved routes with honest placeholders; days 6–30 features are not implemented.

## Routes

Public: `/login`, `/register`.

Protected: `/dashboard`, `/projects`, `/projects/:projectId`, `/projects/:projectId/tasks/new`, `/tasks`, `/tasks/:taskId`, `/settings`. The root redirects to the dashboard; unknown URLs show a 404.

## Backend connection

The repository's backend auth files are currently empty. Set `VITE_AUTH_MODE=api` and `VITE_API_BASE_URL` to the backend API base when it is implemented. Restart Vite after changing environment values. The default API base is `/api`; it needs a same-origin reverse proxy or an explicit backend URL.

Expected frontend contract (to be implemented by the backend):

| Method | Path | JSON body | Successful response |
| --- | --- | --- | --- |
| POST | /auth/login | { email, password } | User |
| POST | /auth/register | { name, email, password } | User, with session established |
| GET | /auth/me | none | User, or 401 for no session |
| POST | /auth/logout | none | 204, with session invalidated |

`User = { id: string, name: string, email: string }`.

The client uses `credentials: 'include'` and an HTTP-only cookie session, restores it via `/auth/me`, and stores only the current user in Zustand memory. The backend must issue/expire cookies, enforce authorization, provide CSRF protection (including Origin validation and an appropriate SameSite policy), and configure credentialed CORS for the exact frontend origin if cross-origin. A frontend route guard alone does not secure an API. No provider keys belong in frontend code or VITE variables.

Errors use safe status-based messages, and requests time out after 15 seconds. Logout clears local state even if the server is unavailable and explicitly reports that the server session may still exist.

## Checks

```powershell
npm run lint
npm test
npm run build
npm run preview
```

Tests cover field validation, password visibility, Enter submission, pending/duplicate submission, registration payloads, protected deep links, all reserved routes, session restoration, logout success/failure, HTTP errors, and accessible status/field labels.

For visual review, check login/register at desktop and mobile widths, keyboard tab order, the mobile navigation dialog (Escape closes it), and page scrolling. Deployments using BrowserRouter must fall back to `index.html` for frontend routes while keeping API paths routed to the backend.

The implementation follows [React Router's declarative routing](https://reactrouter.com/start/declarative/routing) and [Zustand's create API](https://zustand.docs.pmnd.rs/reference/apis/create.html).
