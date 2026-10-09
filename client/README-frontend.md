# Study Desk — frontend pages

These files map each tab of your original Streamlit app to a React page,
sharing one look (parchment background, ink-green accents, a "notebook page"
result panel) and one settings context for model / temperature / study mode.

## Files

```
src/
  App.jsx                    # routes + layout shell
  main.jsx                   # Vite entry point
  index.css                  # design tokens + all styling
  context/SettingsContext.jsx  # shared model/temperature/study-mode state
  api/client.js               # axios calls to your Express backend
  components/
    Sidebar.jsx               # left nav + settings controls
    ResultPanel.jsx            # shared "notebook page" result display
  pages/
    AskQuestion.jsx            # Q&A tab
    NotesSummaries.jsx         # summarize text / topic → notes
    QuizGenerator.jsx          # quiz generator
    Reminders.jsx              # persistent reminders (CRUD, not session state)
```

## Run it

This zip is now a complete, standalone Vite project — you don't need to
create your own React app first.

```bash
cd client
npm install
copy .env.example .env      # (macOS/Linux: cp .env.example .env)
npm run dev
```

(If you're running this as part of the combined `study-desk` project, use
the root `README.md` instead — it installs and runs both client and server
together.)

Then open the URL Vite prints (usually http://localhost:5173). It expects
your Express backend running at the URL in `.env` (default
`http://localhost:5000/api`) — the app will load, but the AI/reminders
calls won't succeed until that backend exists.

If you'd rather merge this into an *existing* React app instead of running
it standalone, just copy the `src/` folder in and skip `package.json`,
`vite.config.js`, and `index.html`.

## Backend contract these pages expect

- `POST /api/ai/ask` → `{ subject, question, level, style, model, temperature, studyMode }` → `{ answer }`
- `POST /api/ai/summarize` → `{ text, summaryLength, highlight, model, temperature, studyMode }` → `{ summary }`
- `POST /api/ai/notes` → `{ topic, depth, model, temperature, studyMode }` → `{ notes }`
- `POST /api/ai/quiz` → `{ quizTopic, numQuestions, quizType, difficulty, model, temperature, studyMode }` → `{ quiz }`
- `GET /api/reminders` → `[{ _id, text, date, time, completed }]`
- `POST /api/reminders` → body `{ text, date, time }` → created reminder
- `PATCH /api/reminders/:id/toggle` → flips `completed`, returns updated reminder
- `DELETE /api/reminders/:id` → removes one
- `DELETE /api/reminders` → clears all

These match the field names your Streamlit app already used (level, style,
summaryLength, quizType, etc.), so your existing Gemini prompts in
`callGemini` port over with only the request-body parsing changed.

## Design notes

Palette is a study-desk theme: parchment background (`--paper`), deep forest
ink (`--primary`), and an ochre accent (`--accent`) — deliberately not the
cream+terracotta or dark+neon look you'll see in a lot of generated UIs.
Headings use Lora (a text-book serif); UI chrome uses IBM Plex Sans. Each
result panel styled to feel like a page in a notebook (single rule down the
left margin), which ties back to the "study assistant" subject matter.
