<div align="center">

# ⚡ GitPulse

### GitHub Repository Intelligence & Analytics Dashboard

**Understand the Pulse of Your Code.**

A full-stack **MERN** application that analyzes any public GitHub repository, converts raw repository
data into readable analytics, stores it in **MongoDB Atlas**, and renders it back as an interactive
React dashboard.

`React` · `Vite` · `Tailwind CSS` · `Recharts` · `Node.js` · `Express` · `Mongoose` · `MongoDB Atlas` · `JWT` · `bcryptjs`

---

> **Important — what GitPulse is not**
> The **GitPulse score** and the **High / Moderate / Low** activity labels are calculated by **this
> project** from real GitHub API data. They are *not* official GitHub metrics, ratings or scores.
> Every number shown in the dashboard is either returned by the GitHub REST API or derived from it
> with documented thresholds (see [Activity indicators](#activity-indicators)).

</div>

---

## Table of contents

1. [Project overview](#project-overview)
2. [Problem statement](#problem-statement)
3. [Solution](#solution)
4. [Feature list](#feature-list)
5. [Technology stack](#technology-stack)
6. [Architecture](#architecture)
7. [Folder structure](#folder-structure)
8. [MongoDB Atlas setup](#mongodb-atlas-setup)
9. [Environment variables](#environment-variables)
10. [GitHub API usage & rate limits](#github-api-usage--rate-limits)
11. [Backend setup](#backend-setup)
12. [Frontend setup](#frontend-setup)
13. [How to run](#how-to-run)
14. [Demo accounts](#demo-accounts)
15. [REST API endpoints](#rest-api-endpoints)
16. [Authentication flow](#authentication-flow)
17. [Analysis flow](#analysis-flow)
18. [Re-analyze flow](#re-analyze-flow)
19. [Repository history](#repository-history)
20. [Comparison feature](#comparison-feature)
21. [User data isolation](#user-data-isolation)
22. [Activity indicators](#activity-indicators)
23. [Error handling](#error-handling)
24. [Automated testing](#automated-testing)
25. [Screenshots](#screenshots)
26. [Future improvements](#future-improvements)
27. [License](#license)

---

## Project overview

GitPulse is a college full-stack development project built around one idea: **a repository is alive, and
you should be able to see its pulse.**

A GitHub repository page shows raw numbers — 12,400 stars, 830 forks, 92 open issues. GitPulse fetches
those same numbers through the GitHub REST API, converts them into four activity indicators, a composite
pulse score and written insights, stores a snapshot of the analysis, and lets you watch how the numbers
move every time you re-analyze.

The project is intentionally built the "textbook MERN" way so it is easy to read, demo and extend:

```
React page → Axios → Express route → JWT middleware → Controller → Service → Mongoose → MongoDB Atlas
```

---

## Problem statement

GitHub tells you *what* the numbers are, but not *what they mean*:

- 12,400 stars and 90 open issues — is the project healthy or abandoned?
- "Updated 3 months ago" — is that a stable library or a dead one?
- 900 stars but 1 contributor — is that a community or a single author?
- Comparing two projects means opening six browser tabs and doing arithmetic by hand.

GitPulse answers those questions with computed indicators, plain-language insights and a historical
timeline of every analysis.

---

## Solution

1. The user signs in (JWT + bcrypt).
2. The user pastes any public GitHub repository URL.
3. The backend parses `owner` / `repo`, calls the GitHub REST API, and collects repository metadata,
   languages, contributors, commits, issues and pull requests.
4. The **analytics service** turns that payload into four activity indicators, one composite score,
   chart-ready series and written insights.
5. **Mongoose** stores the repository plus an immutable `AnalysisHistory` snapshot in MongoDB Atlas.
6. The React dashboard renders the pulse with Recharts.
7. Pressing **Re-analyze** repeats the entire GitHub call and writes a new snapshot, so the history page
   can show the trend between two moments in time.

---

## Feature list

### Authentication & security
- Signup, login, logout, session persistence
- JWT (`userId` + `role` payload), `protect` and `admin` middleware
- Passwords hashed with **bcrypt (12 rounds)** — never stored or returned in plain text
- Role-based admin dashboard (`user` vs `admin`)
- Rate limiting on auth and analysis endpoints
- Centralised error handling — stack traces never reach the user
- Strict user-scoped MongoDB queries (user A can never read user B's repositories)

### Analysis
- Accepts full URLs, `owner/repo`, `.git` suffixes and SSH-style links
- Fetches: name, owner, description, stars, forks, watchers, open/closed issues, pull requests, default
  branch, topics, license, size, created/updated/pushed dates, languages, contributors, recent commits
- Data-driven insights (no invented statistics)
- Project-defined activity indicators with a composite **GitPulse score**
- Loading / empty / success / error states with toast notifications

### Dashboard & analytics
- 5 dashboard stat cards (repositories, stars, forks, contributors, analyses this week)
- **Language distribution** donut + ranked list
- **Commit activity** daily waveform + 12-week histogram
- **Contributor activity** bar chart
- **Issue status** chart with resolved percentage and label breakdown
- **Repository activity timeline** (creation → recent commits → last push)
- **Contribution grid** inspired by GitHub's contribution graph
- Latest commits list and top contributors
- Metric deltas vs. the previous analysis (`+3 stars since 11 Oct 2026`)

### Library, history & comparison
- Repository library with search, language filter, activity filter and 7 sort options
- **Re-analyze** — performs a brand-new GitHub API call and writes a new snapshot
- **History** — snapshot timeline + stars/forks/pulse trend chart + growth summary
- **Compare** — two saved repositories side by side (grouped bars, metric table, language bars,
  indicator bars). GitPulse reports facts and never declares a winner
- Delete a repository together with its history
- Profile page, About/Architecture page, admin console, 404 page

### Design
- Soft indigo / violet palette with electric cyan and coral highlights
- Glass cards, layered gradients, radar-style **Pulse Ring**, animated activity line
- Fully responsive (desktop / laptop / tablet / mobile) with a collapsible sidebar
- `prefers-reduced-motion` respected

---

## Technology stack

| Layer | Technology | Why it is used |
|---|---|---|
| UI | **React 18** | Component-based UI, hooks for auth/toast/data loading |
| Build | **Vite 5** | Instant dev server, optimised production build |
| Styling | **Tailwind CSS 3** | A consistent design system without a big CSS codebase |
| Routing | **React Router 6** | Protected routes, nested layouts, 404 handling |
| HTTP | **Axios** | One configured client that attaches the JWT and normalises errors |
| Charts | **Recharts 2** | Responsive SVG charts (area, bar, pie, line) |
| Icons | **Lucide React** | Consistent, lightweight icon set |
| Runtime | **Node.js 18+** | ES modules, `fetch` available natively |
| API | **Express 4** | Small, readable REST routing layer |
| Auth | **jsonwebtoken**, **bcryptjs** | Stateless JWT + slow password hashing |
| ODM | **Mongoose 8** | Schemas, validation, indexes, aggregation pipelines |
| Database | **MongoDB Atlas** | Cloud-hosted document database |
| External API | **GitHub REST API** | The single source of truth for repository data |
| Utilities | **express-rate-limit**, **cors**, **dotenv** | Hardening and configuration |

---

## Architecture

### Request flow

```
User (browser)
   ↓
React + Tailwind UI
   ↓  Axios  (Authorization: Bearer <JWT>)
Express route            ← rate limiter, CORS
   ↓
authMiddleware           ← verifies JWT, loads user, sets req.user
   ↓
Controller               ← request/response logic only
   ↓
Service                  ← business logic (GitHub calls, analytics, persistence)
   ↓
Mongoose model           ← user-scoped query
   ↓
MongoDB Atlas
   ↓  JSON
React state → Recharts dashboard
```

### Backend layering (no god files)

```
backend/src
├── config/       env.js (validation) · db.js (Atlas connection)
├── routes/       authRoutes · repositoryRoutes · analyticsRoutes · adminRoutes · index
├── controllers/  authController · repositoryController · analyticsController · adminController
├── services/     githubService · analyticsService · repositoryService
├── models/       User · Repository · AnalysisHistory
├── middleware/   authMiddleware (protect + admin) · errorMiddleware (notFound + errorHandler)
├── utils/        ApiError · asyncHandler · response · tokenUtils
├── scripts/      createAdmin.js · smokeTest.js
└── server.js
```

A route only maps a URL to a controller:

```js
// backend/src/routes/repositoryRoutes.js
router.post('/analyze', analyzeLimiter, repositoryController.analyzeRepository);
```

The controller stays thin and delegates to a service:

```js
// backend/src/controllers/repositoryController.js
export const analyzeRepository = asyncHandler(async (req, res) => {
  const result = await repositoryService.analyzeRepository({
    userId: req.user.userId,
    repoUrl: req.body.repoUrl,
  });
  return sendSuccess(res, { data: result, status: result.created ? 201 : 200 });
});
```

### Frontend layering

```
frontend/src
├── pages/        Landing · Login · Signup · Dashboard · Repositories · RepositoryAnalytics
│                 Compare · History · Profile · Admin · About · NotFound
├── layouts/      PublicLayout · AuthLayout · DashboardLayout (sidebar + navbar)
├── components/   Logo · PulseRing · StatCard · RepositoryCard · RepoInput · InsightCard
│                 ActivityBadge · EmptyState · ErrorState · ConfirmDialog · CodeFlow …
├── charts/       LanguageDonut · CommitActivityChart · WeeklyCommitChart · ContributorBarChart
│                 IssueStatusChart · HistoryTrendChart · CompareChart · CompareLanguageChart
│                 ContributionGrid · ActivityTimeline · ChartCard · CustomTooltip
├── context/      AuthContext (JWT session) · ToastContext (notifications)
├── hooks/        useRepositoryLibrary · useDebounce · useCountUp
├── services/     api.js (axios client) · tokenStorage.js
└── utils/        constants.js · format.js · icons.js
```

---

## Folder structure

```
GitPulse/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   ├── charts/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## MongoDB Atlas setup

1. Create a free account at <https://www.mongodb.com/atlas> and create a **free M0 cluster**.
2. **Database Access** → *Add New Database User*
   - Authentication method: *Password*
   - Username / password of your choice
3. **Network Access** → *Add IP Address*
   - For a local demo: `0.0.0.0/0` (allow anywhere)
   - For a locked-down setup: add your own IP
4. **Deploy** the cluster (it takes ~1 minute).
5. Click **Connect** → *Drivers* → **Node.js** and copy the connection string:

   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/gitpulse?retryWrites=true&w=majority
   ```

6. Paste it into `backend/.env` as `MONGO_URI` (replace `<user>`, `<password>` and the cluster host).

> The backend refuses to start when `MONGO_URI` is missing or invalid — it never pretends the database
> is available. Check `GET http://localhost:5000/api/health` for the live `database` status.

### Troubleshooting: `querySrv ECONNREFUSED`

If the connection fails with

```
querySrv ECONNREFUSED _mongodb._tcp.<cluster>.mongodb.net
```

your network's DNS server is refusing SRV queries for Atlas. This is a **DNS** problem, not a
credential problem — re-checking the Atlas Network Access list or the password will not help.

GitPulse handles it automatically: `src/bootstrap.js` configures Node's DNS resolver **before**
Mongoose is loaded. This matters because static ES module imports execute before the importing
module's body, so the resolvers must be set first and the server is then loaded with a dynamic
`import()`.

```bash
cd backend
npm run check:dns   # shows the SRV lookup before and after the fix
```

You can override the resolvers (or disable the override) with the optional `DNS_SERVERS` variable:

```bash
DNS_SERVERS=1.1.1.1,9.9.9.9 npm start   # custom list
DNS_SERVERS=system          npm start   # keep the OS resolver
```

> `--dns-result-order=ipv4first` does **not** fix this error: it only changes the ordering of results
> that were already resolved, while the SRV query itself is being refused.

---

## Environment variables

### `backend/.env` (copy from `backend/.env.example`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Secret used to sign tokens (≥ 16 chars) |
| `JWT_EXPIRES_IN` | ➖ | Token lifetime, default `7d` |
| `PORT` | ➖ | API port, default `5000` |
| `CLIENT_URL` | ➖ | Allowed frontend origin for CORS, default `http://localhost:5173` (comma-separate for several) |
| `GITHUB_TOKEN` | ➖ | Optional personal access token (5,000 req/h instead of 60) |
| `GITHUB_API_URL` | ➖ | Optional API base override (GitHub Enterprise / testing) |

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### `frontend/.env` (optional — copy from `frontend/.env.example`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend, default `http://localhost:5000/api` |
| `VITE_APP_NAME` | Brand label shown in the UI |

> `.env` files are git-ignored. `.env.example` files are committed and contain no real secrets.

---

## GitHub API usage & rate limits

GitPulse uses these public endpoints (no authentication required):

| Endpoint | Used for |
|---|---|
| `GET /repos/{owner}/{repo}` | stars, forks, watchers, description, branch, license, topics, dates |
| `GET /repos/{owner}/{repo}/languages` | byte counts per language |
| `GET /repos/{owner}/{repo}/contributors` | contributor list + all-time contributions |
| `GET /repos/{owner}/{repo}/commits?since=…` | recent commits (daily/weekly activity) |
| `GET /repos/{owner}/{repo}/issues` | open/closed issues (pull requests are filtered out) + labels |
| `GET /repos/{owner}/{repo}/pulls` | open/closed/merged pull requests |
| `GET /rate_limit` | shown on the admin dashboard |

**One analysis uses ~6 requests.** Unauthenticated GitHub allows **60 requests/hour per IP**, which is
enough to demo but easy to exhaust. Creating a free personal access token raises this to **5,000/hour**:

1. GitHub → *Settings* → *Developer settings* → *Personal access tokens* → *Tokens (classic)*
2. Generate a token with **no scopes** for public repositories (or `repo` for your private ones)
3. Put it in `backend/.env` as `GITHUB_TOKEN`

When the limit is hit, GitPulse returns a friendly HTTP **429** message that tells the user when to
retry — it never crashes and never fakes data.

---

## Backend setup

```bash
cd backend
npm install
```

Create the environment file:

```bash
# Windows (PowerShell)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Then edit `backend/.env` and fill in `MONGO_URI` and `JWT_SECRET`.

Run it:

```bash
npm run dev      # auto-restarts on file changes (node --watch)
# or
npm start        # plain start
```

You should see:

```
✦ GitPulse API
  → http://localhost:5000/api/health
  → environment: development
  ✔ MongoDB Atlas connected → db "gitpulse" @ cluster0.xxxxx.mongodb.net
  ✔ GitPulse is ready on port 5000
```

Optional — create an administrator account (prompts for name, email and password):

```bash
npm run seed:admin
# or non-interactive:
node src/scripts/createAdmin.js "Your Name" "you@example.com" "a-strong-password"
```

---

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

Production build:

```bash
npm run build     # → frontend/dist
npm run preview   # preview the production build locally
```

---

## How to run

**Terminal 1 — API**

```bash
cd backend
npm install
cp .env.example .env      # then edit MONGO_URI + JWT_SECRET
npm run dev
```

**Terminal 2 — React app**

```bash
cd frontend
npm install
npm run dev
```

**Browser**

1. Open <http://localhost:5173>
2. Click **Get started** → create an account
3. You land on the dashboard — *Welcome back, {your name}*
4. Paste a repository URL, e.g. `https://github.com/facebook/react`, and press **Analyze Repository**
5. Explore the analytics, press **Re-analyze**, open **Compare** and **History**
6. (Optional) `npm run seed:admin` in `backend/`, log in with that account and open **Admin**

---

## Demo accounts

No credentials are hard-coded anywhere in this project. Create them yourself:

**Normal user** — just use the signup form on <http://localhost:5173/signup>.

**Admin user**

```bash
cd backend
npm run seed:admin
# Admin name: Your Name
# Admin email: you@example.com
# Admin password: choose-a-strong-password
```

The admin panel then appears in the sidebar and at `/admin`. A normal account that tries to call the
admin API receives **403 Forbidden** and the `/admin` page explains why.

---

## REST API endpoints

Base URL: `http://localhost:5000/api`
All responses use `{ success, message?, data?, meta? }`; errors use `{ success: false, message, code }`.

### Public

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service status, DB connection, uptime |
| `GET` | `/meta` | Indicator definitions and score weights |

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create an account (role always `user`) → `201` |
| `POST` | `/auth/login` | — | Verify password, return JWT |
| `GET` | `/auth/me` | JWT | Current user + repository/analysis counters |
| `PUT` | `/auth/profile` | JWT | Update display name only (never role/email) |
| `POST` | `/auth/logout` | JWT | Explicit logout step |

### Repositories

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/repositories/analyze` | JWT | Analyse a URL → `201` (new) / `200` (refresh) |
| `GET` | `/repositories` | JWT | User's library (`?search=&sort=&language=&activity=`) |
| `GET` | `/repositories/summary` | JWT | Aggregated dashboard statistics |
| `GET` | `/repositories/compare` | JWT | `?a=<id>&b=<id>` — factual comparison |
| `GET` | `/repositories/:id` | JWT | One repository (user-scoped) |
| `POST` | `/repositories/:id/reanalyze` | JWT | Fresh GitHub call + new snapshot |
| `DELETE` | `/repositories/:id` | JWT | Delete repository and its history |
| `GET` | `/repositories/:id/history` | JWT | Snapshots + trend + growth summary |
| `GET` | `/analytics/repositories/:id/analytics` | JWT | Full analytics view model |

### Admin (JWT **and** `admin`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/users` | Paginated user list (`?search=&page=&limit=`) |
| `GET` | `/admin/statistics` | Totals, averages, recent users/analyses, GitHub rate limit |
| `PATCH` | `/admin/users/:id/role` | Promote / demote an account |

### Status codes used

`200` OK · `201` Created · `400` Bad request · `401` Unauthenticated / invalid or expired JWT ·
`403` Forbidden (wrong role) · `404` Not found · `409` Duplicate email · `429` Rate limited ·
`502` GitHub upstream failure · `503` Database unavailable

---

## Authentication flow

```
Signup:
  React → POST /api/auth/register
        → validate input
        → bcrypt.hash(password, 12)
        → User.create(...)  → MongoDB Atlas
        → jwt.sign({ userId, role }, JWT_SECRET)
        → { user, token }

Login:
  React → POST /api/auth/login
        → User.findOne({ email }).select('+password')
        → bcrypt.compare(...)
        → jwt.sign({ userId, role })
        → { user, token }  → stored in localStorage

Protected request:
  React → Axios attaches "Authorization: Bearer <token>"
        → authMiddleware verifies signature + expiry
        → loads the user from MongoDB
        → req.user = { userId, role, name, email }
        → controller runs a user-scoped query

Logout:
  POST /api/auth/logout → client clears the token
  (the Axios layer also listens for 401 responses and signs the user out automatically)
```

> The role is always read from the database on each request, so promoting or demoting a user takes
> effect immediately.

---

## Analysis flow

```
React (RepoInput)
  → POST /api/repositories/analyze  { repoUrl }
  → repositoryRoutes → authMiddleware (JWT)
  → repositoryController.analyzeRepository
  → repositoryService.analyzeRepository
      → githubService.parseRepositoryUrl(input)
      → githubService.fetchRepositoryData(owner, repo)   ← 6 parallel GitHub calls
      → analyticsService.computeAnalytics(data)           ← indicators + insights + chart series
      → Repository.findOne({ userId, fullName }) / create → MongoDB Atlas
      → AnalysisHistory.create(snapshot)
  → 201 JSON { repository, deltas, created }
  → React navigates to /repositories/:id → Recharts dashboard
```

---

## Re-analyze flow

Re-analyze **always calls the GitHub API again** — it never re-sends cached MongoDB data.

```
React (Re-analyze button)
  → POST /api/repositories/:id/reanalyze
  → authMiddleware (JWT)
  → repositoryController.reanalyzeRepository
  → repositoryService.reanalyzeRepository
      → Repository.findOne({ _id: id, userId })        ← ownership enforced
      → githubService.fetchRepositoryData(...)          ← LIVE data
      → analyticsService.computeAnalytics(...)
      → apply deltas vs. the stored document
      → doc.save()                                      ← updated repository
      → AnalysisHistory.create(snapshot)                ← new point in the timeline
  → 200 JSON { repository, deltas }
  → React shows "Refreshing repository data…", then a success toast,
    an updated timestamp and re-rendered charts + insights
```

Visible effects: stars/forks/issue deltas, `analysisCount`, the "Change since your previous analysis"
insight, and a new entry on the History page.

---

## Repository history

Every analyse and re-analyse writes an immutable `AnalysisHistory` document:

```json
{
  "repositoryId": "…",
  "userId": "…",
  "source": "reanalyze",
  "snapshot": {
    "stars": 15210, "forks": 2310, "openIssues": 88, "contributors": 412,
    "primaryLanguage": "JavaScript", "commits30Days": 37,
    "pulseScore": 81, "pulseLabel": "high",
    "commitActivity": "high", "contributorActivity": "moderate",
    "issueActivity": "high", "updateFrequency": "high"
  },
  "analyzedAt": "2026-10-11T06:27:29.000Z"
}
```

The **History** page turns those snapshots into a trend chart (stars / forks / pulse) and a snapshot
timeline, plus a growth summary:

```
10 stars  →  15 stars  →  21 stars      = +11 stars across 3 snapshots
```

---

## Comparison feature

1. Open **Compare**
2. Pick two repositories from your library
3. GitPulse shows:
   - two repository header cards (pulse badge, stars, forks, contributors, primary language)
   - a grouped bar chart for stars, forks, watchers, issues, contributors, 30-day commits, pulse score
   - a language-share bar chart
   - a metric-by-metric table with a signed difference column
   - both repositories' four activity indicators side by side

> **GitPulse reports factual metrics only.** It never declares one repository "better" than another —
> the API response even includes that note.

---

## User data isolation

Every repository query is scoped to the authenticated user:

```js
// backend/src/services/repositoryService.js
Repository.findOne({ _id: repositoryId, userId });      // read
Repository.findOneAndDelete({ _id, userId });           // delete
Repository.find({ userId, ...filters });                // list
Repository.aggregate([{ $match: { userId: new ObjectId(userId) } }, …]); // stats
```

`userId` comes from the verified JWT (`req.user.userId`), never from the request body. Requesting
another user's repository returns **404** (not 403) so the API does not confirm that the id exists.
There is also a compound unique index `{ userId, fullName }`, so the same repository can be tracked by
different users but never twice by one user.

---

## Activity indicators

Four indicators are computed from real GitHub data and labelled **High / Moderate / Low**:

| Indicator | Weight | High | Moderate | Low |
|---|---|---|---|---|
| **Commit activity** | 35% | ≥ 20 commits / 30 days | ≥ 8 | below |
| **Contributor activity** | 25% | ≥ 8 distinct authors / 90 days | ≥ 3 | below |
| **Update frequency** | 25% | pushed ≤ 1 day ago | ≤ 7 days | > 7 days |
| **Issue activity** | 15% | ≥ 60% of sampled issues closed | ≥ 30% | below |

**GitPulse score** = weighted sum of the four indicator scores (0–100).
`≥ 70` → High, `≥ 40` → Moderate, otherwise Low.

The thresholds live in one place (`backend/src/services/analyticsService.js` → `THRESHOLDS`), are served
by `GET /api/meta`, and are explained in the UI (chart tooltips, the pulse card and the About page).

---

## Error handling

Every failure produces a friendly message — never a stack trace:

| Situation | HTTP | Message shown to the user |
|---|---|---|
| Invalid signup input | `400` | "Password must be at least 8 characters long." |
| Duplicate email | `409` | "An account with that email already exists. Try signing in instead." |
| Wrong credentials | `401` | "Incorrect email or password. Please try again." |
| Missing token | `401` | "You need to sign in to perform this action." |
| Invalid token | `401` | "Your session is invalid. Please sign in again." |
| Expired token | `401` | "Your session has expired. Please sign in again." |
| Normal user → admin API | `403` | "Administrator access is required for this resource." |
| Another user's repository | `404` | "We could not find that repository in your library." |
| Bad repository URL | `400` | "That does not look like a GitHub repository URL…" |
| Repository not found / private | `404` | "We could not find that repository (owner "x" / repository "y")…" |
| GitHub rate limit | `429` | "GitHub API rate limit reached… try again after 12:36, or configure a free GITHUB_TOKEN…" |
| GitHub is down (5xx) | `502` | "The GitHub API is temporarily unavailable…" |
| No internet | `503` | "Could not reach the GitHub API. Please check your internet connection." |
| Backend unreachable | — | "Could not reach the GitPulse server. Make sure the backend is running on port 5000…" |
| Database down | `503` | "GitPulse cannot reach its database right now…" |

Implementation: `ApiError` (typed HTTP errors) + `asyncHandler` (async errors reach Express) +
`errorMiddleware` (Mongoose validation/cast/duplicate-key, JWT errors, DB-down detection, safe fallback).
The Axios layer converts every failure into `{ status, code, message, details }`, and `ToastContext`
renders it as a styled toast.

---

## Automated testing

The backend ships with an end-to-end smoke test that exercises the **real** API:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd backend
npm run smoke
```

It verifies: server + DB health, signup validation, duplicate email, login, wrong password, JWT
protection, invalid tokens, admin protection (403), invalid URL, non-existent repository, real GitHub
analysis, languages, indicators, insights, chart data, user isolation (list/read/delete), search,
sorting, analytics endpoint, history snapshots, **re-analyze**, deltas, comparison, deletion and 404
handling.

```
passed: 50   failed: 0
```

The frontend was verified with a production build (`npm run build`) and a headless-browser pass through
the landing page → signup → dashboard → analysis → re-analysis → library → compare → history → profile →
mobile/tablet layouts, with **zero console errors**.

---

## Screenshots

> Replace the placeholders below with your own screenshots (right-click → *Save image as…* on each
> screen of the running app).

| Screen | Where to find it |
|---|---|
| Landing page — hero, pulse ring preview | `/` |
| Landing page — how it works (pipeline) | `/` |
| Login / Signup | `/login`, `/signup` |
| Dashboard — stats + repository input | `/dashboard` |
| Repository analytics — charts, indicators, insights | `/repositories/:id` |
| Re-analyze — refreshed metrics and deltas | `/repositories/:id` |
| My repositories — library with filters | `/repositories` |
| Repository compare | `/compare` |
| Analysis history | `/history` |
| Profile | `/profile` |
| Admin console | `/admin` (admin account) |
| About / architecture | `/about` |
| Mobile / tablet layouts | any page, narrow window |

---

## Future improvements

- Scheduled background re-analysis with a job queue so snapshots accumulate automatically
- Compare three or more repositories at once and export the comparison as PNG/CSV
- Team workspaces where several members share one repository library with roles
- Commit sentiment and code-review indicators derived from pull request metadata
- Offline-friendly PWA with cached analytics for recently viewed repositories
- Public read-only share links for a single repository
- GitHub OAuth login in addition to email/password
- Branch-level analysis (compare `main` against a feature branch)
- WebSocket push so the dashboard updates while a re-analysis is running

---

## License

MIT — built as a full-stack development project.

<div align="center">

**GitPulse** — *Understand the Pulse of Your Code.*

</div>