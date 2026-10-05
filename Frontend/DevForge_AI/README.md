# DevForge AI frontend

Implementation of **days 1–15** of the supplied *Frontend 30 Days Plan*, retaining the existing React + TypeScript + Vite project. Days 13–15 (PDF pages 22–25) add the execution dashboard, agent timeline, and live SSE updates, building on project creation and task controls from days 8–12.

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
| 6 | Project/running/approval/completed/failed counts, recent tasks sorted by latest activity, task links, approval review links, Open Projects CTA, clear empty states |
| 7 | Searchable project cards, repository status, default branch, recent task count, Open links, loading skeletons, recoverable API errors |
| 8 | Create/connect project form, HTTPS repository URL and branch validation, duplicate/error handling, duplicate-submit protection, project details redirect, preparation status |
| 9 | Project-by-ID loading, repository readiness/indexing/error status, branch, recent tasks, collapsible file metadata, and full task history view |
| 10 | Task description/examples, supported modes, optional constraints, validation, duplicate-submit protection, create API and execution redirect |
| 11 | Auto model default, advanced provider/model selection from backend configuration, disabled unavailable choices, saved task metadata, no credential inputs |
| 12 | Task get/create/start/cancel/diff/tests services, detail loading, pending-only Start AI, confirmed cancellation for running/waiting tasks, readable API errors |
| 13 | Task metadata/elapsed time, prominent controls, seven execution panels, loading/empty states, completion/failure banners, desktop columns and mobile stacking |
| 14 | Manager, Planner, Analyst, Developer, Tester, Reviewer timeline; waiting/active/done/failed states; responsibilities; current-stage highlight; unknown-role fallback |
| 15 | Credentialed EventSource lifecycle, validated events applied to an execution store, connection/reconnect/offline status, manual recovery, cleanup on leave/account/task changes |

The demo account displays three sample projects and six initial tasks covering every status. New demo registrations have empty workspaces. The Commerce storefront project is ready for task creation; Platform API illustrates indexing and Design system has no connected repository. Create tasks in Commerce, select Auto or an available demo model, start them, and confirm cancellation. Created tasks appear in project history and dashboard activity. Changes live in memory and reset on refresh. Provider availability and model names are illustrative. No repository is cloned, no AI runs, and no code changes or tests are executed. Fixtures load only in development demo mode and are excluded from production builds.

The **Create / Connect project** button opens a form with project name, optional description, repository URL, and default branch (initially `main`). It accepts HTTPS clone URLs without embedded credentials, query parameters, or fragments. Successful creation redirects to project details, where repository preparation status is visible. New demo registrations can create projects too; demo projects initially show indexing, then become ready when you click **Refresh project** after three seconds. Their file lists stay empty because no real repository is fetched. Projects are isolated per demo account and remain available when signing out/in within the same page session, until refresh.

Open Project and task links load their respective details. Task creation requires a ready repository and loaded backend capabilities. Start/cancel responses and stream events update the execution view; **Refresh details** reloads it. The execution page shows AI Plan, Agent Timeline, Live Logs, Changed Files, Tests, Approval Queue, and Final Summary. Detailed diff viewers, log filtering, and interactive approval decisions belong to later days. The standalone recent-tasks page remains a placeholder; use the dashboard or project history to open tasks.

In demo mode, open a running task (or start a pending one) to preview the six agent stages over about 16 seconds. These timed events run only while the execution view is open. The demo leaves the task running until you cancel it; it does not claim that AI work or real tests completed. Completed/failed fixtures show illustrative summaries; the waiting-approval fixture shows a sample decision. Demo stream code is excluded from production builds.

Both pages retain loading, empty, and error states. Search matches project names, descriptions, repository URLs, and branches without case sensitivity; no search matches is distinct from an empty workspace. Dashboard counts use all returned tasks, while recent activity shows the six most recently updated tasks. Failed requests show unavailable counts rather than misleading zeroes, and each resource can be retried independently.

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

### Workspace API contract (days 6–7)

Backend project/task API files are also scaffolds. In API mode, implement these authenticated, user-scoped endpoints before expecting live data:

| Method | Path | Successful response |
| --- | --- | --- |
| GET | /projects | `Project[]` |
| GET | /tasks | `Task[]` |

```ts
type Project = {
  id: string
  name: string
  description: string
  repository: { url: string; defaultBranch: string } | null
  recentTaskCount: number
  updatedAt: string // ISO timestamp
}
type Task = {
  id: string
  projectId: string
  projectName: string
  title: string
  status: 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled'
  updatedAt: string // ISO timestamp
}
```

Return complete arrays for the current workspace, not a paginated subset: the dashboard calculates counts from these responses. IDs must be unique within each list, timestamps valid, and recent task counts nonnegative integers. The frontend validates responses, cancels abandoned requests, and ignores late results from a previous user. The server must enforce ownership for both endpoints. No production fallback to sample data is used when requests fail.

## Checks

```powershell
npm run lint
npm test
npm run build
npm run preview
```

Tests cover field validation, password visibility, Enter submission, pending/duplicate submission, registration payloads, protected deep links, all routes, session restoration, logout success/failure, HTTP errors, and accessible status/field labels.

Workspace tests additionally cover computed counts, recent-task ordering, all task statuses, approval/task/project links, case-insensitive search and clearing search, missing repositories, skeletons, empty states, retry recovery, malformed responses, the create/connect dialog, and isolation from late requests after an account change.

Day 8 tests cover required fields, URL/branch validation, normalized create payloads, Enter submission, indexing status after redirect, duplicate and failed creation with retry, disabled submission/dismissal while pending, account changes, and demo preparation plus project ownership.

### Project creation API contract (day 8)

`POST /projects` accepts the following JSON body and returns a complete `ProjectDetails` (defined below), including its server-assigned ID and repository status. Use HTTP 201, or 202 if preparation is queued. The frontend then loads `GET /projects/:projectId` after redirecting.

```ts
type CreateProjectInput = {
  name: string // required, at most 100 characters
  description: string // optional content, at most 2,000 characters
  repositoryUrl: string // required HTTPS clone URL, at most 2,048 characters
  defaultBranch: string // required branch, at most 255 characters
}
```

Return 409 for a duplicate project name/repository, 422 for invalid fields, and an appropriate 5xx status for server failures. The frontend shows project-specific errors and preserves form values for retry. It disables repeat submission and dialog dismissal while creation is pending. The backend remains responsible for authentication, ownership, uniqueness, URL/branch validation, safe repository fetching, and asynchronous preparation/indexing; frontend validation alone does not authorize or secure a clone. No credentials are entered into this form, and no repository is fetched directly from the browser. In API mode these endpoints must be implemented before real connections work.

Task workflow tests cover project/file/history loading, all repository states, create validation and redirects, configuration failure/retry, unavailable models, model metadata, optional capability fields, duplicate requests, start/cancel confirmation, terminal states, readable 409/422/500 failures, and late responses after route/account changes. API tests cover encoded IDs, payloads, signals, malformed responses, public configuration allowlisting, diff/tests, and resource identity. Demo tests cover the full lifecycle and account isolation.

### Workspace API contract (days 9–12)

These frontend integrations are ready, but the repository's backend endpoints are still scaffolds. Implement the following authenticated endpoints to use API mode. All mutations return the complete updated task; start may respond with HTTP 202 and should enqueue work without waiting for the AI run to finish.

| Method | Path | Request / response |
| --- | --- | --- |
| GET | `/projects/:projectId` | `ProjectDetails` |
| GET | `/agents/config` | Public `AgentConfig`, without credentials |
| POST | `/projects/:projectId/tasks` | `CreateTaskInput` → `TaskDetails` |
| GET | `/tasks/:taskId` | `TaskDetails` |
| POST | `/tasks/:taskId/start` | No body → `TaskDetails` |
| POST | `/tasks/:taskId/cancel` | No body → `TaskDetails` |
| GET | `/tasks/:taskId/diff` | `TaskDiff` |
| GET | `/tasks/:taskId/tests` | `TaskTests` |

See `src/types/workspace.ts` for exact TypeScript contracts. Detail responses extend the list types above:

```ts
type ProjectDetails = Project & {
  repositoryStatus: 'ready' | 'indexing' | 'error' | 'disconnected'
  files: { path: string; size: number }[] // relative paths; bytes; metadata only
  tasks: Task[] // complete project history, each task belonging to this project
}
type CreateTaskInput = {
  description: string
  constraints: string
  mode: 'implement' | 'explain' | 'review'
  provider?: string // 'auto' by default when model selection is supported
  model?: string // only for an explicitly selected provider
}
type TaskDetails = Task & CreateTaskInput & {
  branch: string | null
  startedAt?: string | null // ISO timestamp for actual run start
  finishedAt?: string | null // ISO timestamp for actual run end
}
type AgentConfig = {
  modes: ('implement' | 'explain' | 'review')[] // includes implement
  supportsModelSelection: boolean
  providers: {
    id: string; label: string; available: boolean
    models: { id: string; label: string; available: boolean }[]
  }[]
}
type TaskDiff = { files: { path: string; status: 'added' | 'modified' | 'deleted'; diff: string }[] }
type TaskTests = { status: 'not_run' | 'running' | 'passed' | 'failed'; passed: number; failed: number; output: string }
```

Return unavailable providers with `available: false` so their configuration state can be displayed. IDs must be unique within provider/model lists. The frontend omits provider/model fields when `supportsModelSelection` is false, validates responses, cancels abandoned requests, and ignores stale data. The backend must enforce ownership, supported options, repository readiness, allowed transitions, and constraints independently. Use 404 for missing resources, 409 for conflicting state, and 422 for invalid inputs. Existing cookie-session and CSRF requirements above apply to these endpoints too.

Frontend checks passed with `npm.cmd run lint`, `npm.cmd test`, and `npm.cmd run build` on Windows. Use `npm.cmd` if PowerShell blocks the `npm.ps1` shim.

### Live execution contract (days 13–15)

The backend stream remains a scaffold. Implement `GET /tasks/:taskId/stream` under `VITE_API_BASE_URL`, using the same authenticated cookie session as the REST API and enforcing task ownership. The frontend uses native `EventSource` with `withCredentials: true`; it does not put tokens or provider keys in the URL or set a custom Authorization header. For a separate API origin, configure credentialed CORS for the exact frontend origin and an appropriate cookie policy.

Send `Content-Type: text/event-stream` and UTF-8 messages separated by a blank line. Use default `message` events (omit the SSE `event:` field). Each JSON payload must include a unique string `id`, matching `taskId`, and a valid ISO `timestamp`. The SSE `id:` should match the JSON ID. For example:

```text
id: event-42
data: {"id":"event-42","taskId":"task-1","timestamp":"2026-10-05T10:00:00Z","type":"agent_started","agent":"planner","message":"Breaking down the request."}

```

`src/types/execution.ts` defines the supported event union:

| Event type | Additional fields |
| --- | --- |
| `task_started` | none; timestamp is the actual start time |
| `agent_started`, `agent_completed`, `agent_failed` | `agent: string`, optional `message: string` |
| `plan_updated` | `steps: string[]` |
| `log` | `message: string` |
| `file_changed` | `file: { path, status: 'added' \| 'modified' \| 'deleted' }` |
| `test_result` | `result: TaskTests` |
| `approval_required` | `approval: { id: string, description: string }` |
| `task_completed`, `task_failed`, `task_cancelled` | `summary: string`; timestamp is the actual finish time |

Events must be ordered per task. On a fresh connection, replay the task's history so existing plans, timeline stages, logs, and results can be restored, then continue streaming. For native reconnection, resume using `Last-Event-ID`. A manual reconnect or browser offline/online transition sends `?lastEventId=<last accepted JSON event ID>`; the backend must support this cursor too. If a task is already finished, replay through its terminal event. Terminal events and successful cancellation close the connection. A fresh view resets its store and replays from the beginning.

Malformed JSON, unsupported events, invalid payloads, other-task events, and duplicate IDs are ignored. Event bodies are limited to 100,000 characters; the store retains the latest 2,000 IDs, 300 log messages, 500 file entries, and 100 pending approval notices. Backend output should be redacted before streaming. Text is rendered as text, not HTML. Stream status is separate from task status: losing the connection does not mark the task failed. Native retries show **Reconnecting**; a closed/unavailable connection shows **Offline** with a manual retry. This follows the [MDN EventSource/SSE lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).

Elapsed time uses `startedAt`/`finishedAt` from REST or task lifecycle events, never the time the page opened. Older responses without these fields display **Not available**. The store ignores stale HTTP updates that would undo a more recent streamed status and keeps each task/account view isolated. Changed-file/test/approval panels display event summaries; detailed diff interaction and approve/reject actions remain later milestones.

Execution tests cover all seven panels, loading/empty states, six-agent and unknown-agent rendering, live updates, completed/failed banners, duration ticking/freezing, simulated events, payload validation, deduplication, stale status responses, historical replay, credentialed stream URLs, native/manual reconnection, offline recovery, task/account cleanup, and late callbacks. Visual browser verification was unavailable in the current tooling session.

For visual review, check login/register at desktop and mobile widths, keyboard tab order, the mobile navigation dialog (Escape closes it), and page scrolling. Deployments using BrowserRouter must fall back to `index.html` for frontend routes while keeping API paths routed to the backend.

The implementation follows [React Router's declarative routing](https://reactrouter.com/start/declarative/routing) and [Zustand's create API](https://zustand.docs.pmnd.rs/reference/apis/create.html).
