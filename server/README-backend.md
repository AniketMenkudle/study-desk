# Study Desk — backend

Express + MongoDB API that powers the React frontend. Every route matches
the contract in the frontend's `src/api/client.js` and `README-frontend.md`.

## Files

```
server.js                        # app setup, CORS, routes, error handler
config/db.js                     # MongoDB connection
models/Reminder.js                # reminder schema
utils/geminiClient.js             # Gemini API wrapper (ported from call_study_agent in app.py)
utils/asyncHandler.js             # forwards async route errors to Express
controllers/aiController.js       # ask / summarize / notes / quiz — prompts ported from app.py
controllers/reminderController.js # reminder CRUD
routes/ai.js                      # POST /api/ai/*
routes/reminders.js               # /api/reminders CRUD
```

## Setup

```bash
cd server
npm install
copy .env.example .env      # (macOS/Linux: cp .env.example .env)
```

(If you're running this as part of the combined `study-desk` project, use
the root `README.md` instead — it installs and runs both client and server
together.)

Edit `.env`:
- `GOOGLE_API_KEY` — your Gemini API key (same one from the original `.env`)
- `MONGO_URI` — a local MongoDB (`mongodb://127.0.0.1:27017/study-assistant`) or an Atlas connection string
- `CLIENT_ORIGIN` — the frontend's URL, so CORS allows it (defaults to `http://localhost:5173`, matching the Vite dev server)

You need MongoDB running locally, or an Atlas cluster — this app doesn't create one for you.

## Run

```bash
npm run dev
```

Starts on `http://localhost:5000` (or whatever `PORT` you set). Confirm it's
up with:

```
GET http://localhost:5000/api/health   →   { "ok": true }
```

## Endpoints

| Method | Path                        | Body                                                              | Returns              |
|--------|-----------------------------|--------------------------------------------------------------------|-----------------------|
| POST   | /api/ai/ask                 | subject, question, level, style, model, temperature, studyMode    | `{ answer }`          |
| POST   | /api/ai/summarize           | text, summaryLength, highlight, model, temperature, studyMode     | `{ summary }`         |
| POST   | /api/ai/notes               | topic, depth, model, temperature, studyMode                       | `{ notes }`           |
| POST   | /api/ai/quiz                | quizTopic, numQuestions, quizType, difficulty, model, temperature, studyMode | `{ quiz }` |
| GET    | /api/reminders               | —                                                                   | `[reminder]`          |
| POST   | /api/reminders               | text, date, time                                                   | created reminder      |
| PATCH  | /api/reminders/:id/toggle    | —                                                                   | updated reminder      |
| DELETE | /api/reminders/:id           | —                                                                   | `{ deleted: true }`   |
| DELETE | /api/reminders               | —                                                                   | `{ cleared: true }`   |

## Notes on what's not here yet

- **No authentication.** Reminders are global (any request sees all of them)
  — there's no `User` model or JWT check. The frontend's `api/client.js`
  already attaches a token from `localStorage` if one exists, so adding
  login later is just: add a `User` model + `/api/auth` routes, add an
  `auth` middleware, and add `userId` to the `Reminder` schema and every
  query in `reminderController.js`.
- **No conversation history.** Q&A/summary/quiz results aren't saved to the
  database — each request is stateless, same as the original Streamlit app.
  Add a `Conversation` model and save inside each `aiController` function if
  you want a history view.
