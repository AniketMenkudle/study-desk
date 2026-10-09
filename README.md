# Study Desk (MERN)

Full-stack rebuild of the original Streamlit "Multi-Agent Personal Study
Assistant" — React frontend + Express/MongoDB backend, calling Google
Gemini for Q&A, summaries, notes, and quizzes, with persistent reminders.

```
study-desk/
  client/     React (Vite) frontend — see client/README-frontend.md
  server/     Express + MongoDB backend — see server/README-backend.md
```

## What's new in this version

- **New look** - violet/blue/cyan palette, animated sidebar, light + dark mode toggle
- **Bigger output panel** - fills the screen, with an **Expand** button that hides the form
- **Interactive quiz** - click the options; *Practice* mode shows right/wrong instantly,
  *Exam* mode lets you answer everything and then submit; score ring + per-question review
- **PDF downloads** - the quiz paper (**Download MCQs**), questions + answer key, and a
  **detailed answers report** (score, your answer vs correct answer, explanations).
  Ask and Notes answers also have **Copy** and **PDF** buttons
- Example chips, Ctrl/Cmd+Enter to submit, loading skeletons, overdue highlighting for reminders
- Backend: quiz now returns structured JSON, options are shuffled server-side, output limit
  raised from 1024 to 4096 tokens (8192 for quizzes), and the default model updated
  (`gemini-2.0-flash` was shut down by Google on 1 June 2026). Set `GEMINI_MODEL` in
  `server/.env` to change the default.

## Login, accounts and saved quizzes

- **Register / log in** - accounts are stored in MongoDB (`users` collection). Passwords are hashed
  with bcrypt and never stored or returned in plain text. Login uses an `httpOnly` cookie (a signed
  JWT, valid 7 days) so page scripts can't read it.
- **All study tools now require a login** (this also protects your Gemini API key from strangers).
- **Saved quizzes** - every generated quiz is saved to MongoDB (`quizzes` collection) and appears
  under **Saved quizzes**. Open one to **Read** it (answers + explanations), **Take** it again, or see
  your **History** of scores. Each attempt is scored on the server and can be downloaded as a
  detailed PDF report any time.
- **Reminders are private per user.** Reminders created before this update have no owner, so they
  won't show up (clear them in MongoDB if you like: `db.reminders.deleteMany({ user: { $exists: false } })`).
- **Styling** is Tailwind CSS v4 (`client/src/index.css` holds the theme colours; dark mode via the
  sidebar toggle).

### Required setup (server/.env)

Copy `server/.env.example` to `server/.env` and set:

```
MONGO_URI=mongodb://127.0.0.1:27017/study-assistant
GOOGLE_API_KEY=your_key
JWT_SECRET=<long random string>
```

Generate a secret with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
The server refuses to start without a `JWT_SECRET`.

### API overview

| Route | Purpose |
|---|---|
| `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me` | accounts |
| `GET /api/quizzes`, `GET /api/quizzes/:id` | list / open saved quizzes |
| `POST /api/quizzes/:id/attempts` | save an attempt (scored server-side) |
| `PATCH /api/quizzes/:id`, `DELETE /api/quizzes/:id` | rename / delete |
| `POST /api/ai/*`, `/api/reminders/*` | AI tools and reminders (login required) |

> Deploying the client and server on different domains? Cookies then need `SameSite=None; Secure`
> over HTTPS - change `cookieOptions()` in `server/utils/token.js`.

## Prerequisites

> Requires **Node.js 20.19+** (22 LTS recommended) for the client (Vite 8). `npm audit` reports 0 vulnerabilities in both client and server.


- Node.js 18+
- A MongoDB instance — local (`mongod` running) or a free MongoDB Atlas cluster
- A Google Gemini API key

## Setup

```bash
npm run install:all
```

This installs dependencies in both `client/` and `server/` (and the root,
for the `concurrently` dev script) in one go — same as running `npm install`
in each folder separately.

Then create both env files from their templates:

```bash
# macOS/Linux
cp server/.env.example server/.env
cp client/.env.example client/.env

# Windows
copy server\.env.example server\.env
copy client\.env.example client\.env
```

Edit `server/.env`:
- `GOOGLE_API_KEY` — your Gemini API key
- `MONGO_URI` — e.g. `mongodb://127.0.0.1:27017/study-assistant`, or your Atlas connection string
- `CLIENT_ORIGIN` — defaults to `http://localhost:5173`, already matching the Vite dev server

`client/.env` already points at `http://localhost:5000/api`, matching the
server's default port — leave it as-is unless you change `PORT` in
`server/.env`.

## Run both at once

```bash
npm run dev
```

This starts the client (`http://localhost:5173`) and server
(`http://localhost:5000`) together, with labeled, color-coded logs. Stop
both with Ctrl+C.

To run them separately instead (e.g. two terminal tabs):

```bash
npm run dev:client
npm run dev:server
```

## Verify it's working

1. `http://localhost:5000/api/health` → `{ "ok": true }`
2. Open `http://localhost:5173` → the "Ask a question" page should load
3. Ask a question — if it errors, check the server terminal: it's almost
   always a missing/invalid `GOOGLE_API_KEY` or a MongoDB connection that
   never came up
4. Add a study reminder, then refresh the page — it should still be there
   (this is the persistence the original Streamlit version didn't have)

## Where to go next

Both `client/README-frontend.md` and `server/README-backend.md` have
line-by-line detail on their own folders. The backend README also lists
what's intentionally not built yet (auth, saved conversation history) as
clear next steps if you want to extend this further.
