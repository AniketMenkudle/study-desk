import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, PlayCircle, History, FileDown, KeyRound, Trash2, Pencil, Check, X, Trophy } from "lucide-react";
import { getQuiz, saveAttempt, renameQuiz, deleteQuiz, errorMessage } from "../api/client";
import { exportQuizPaper, exportQuizReport } from "../utils/pdf";
import QuizPlayer from "../components/QuizPlayer";
import QuizReader from "../components/QuizReader";
import { EmptyState, LoadingBlock, PanelBar, panelCls } from "../components/ResultPanel";
import { Button, ButtonLink, Chip, formatDate, inputCls, cx } from "../components/ui";

const TABS = [
  ["read", BookOpen, "Read"],
  ["take", PlayCircle, "Take quiz"],
  ["history", History, "History"],
];

const tone = (p) => (p >= 70 ? "good" : p >= 40 ? "warn" : "bad");
// Full class names (Tailwind can't see classes built from string pieces)
const badgeCls = { good: "bg-good-bg text-good", warn: "bg-warn-bg text-warn", bad: "bg-bad-bg text-bad" };

export default function QuizDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("read");
  const [playKey, setPlayKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setQuiz(null);
    setError("");
    getQuiz(id).then(setQuiz).catch((err) => setError(errorMessage(err, "Quiz not found.")));
  }, [id]);

  async function handleFinished(answers, mode) {
    const attempt = await saveAttempt(id, { answers, mode });
    setQuiz((q) => ({ ...q, attempts: [...(q.attempts || []), attempt] }));
  }

  async function handleRename(e) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    try {
      const saved = await renameQuiz(id, title);
      setQuiz((q) => ({ ...q, title: saved }));
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${quiz.title}" and all its results? This can't be undone.`)) return;
    try {
      await deleteQuiz(id);
      navigate("/library", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (error && !quiz) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-10 text-center shadow-lift">
        <p className="mb-5 text-bad">{error}</p>
        <ButtonLink to="/library" variant="ghost"><ArrowLeft size={16} /> Back to library</ButtonLink>
      </div>
    );
  }
  if (!quiz) {
    return <div className="rounded-2xl border border-line bg-surface p-8"><LoadingBlock label="Opening quiz…" /></div>;
  }

  const attempts = [...(quiz.attempts || [])].reverse(); // newest first
  const best = attempts.reduce((m, a) => (typeof a.percent === "number" ? Math.max(m, a.percent) : m), -1);

  return (
    <>
      <Link to="/library" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-soft no-underline hover:text-primary">
        <ArrowLeft size={16} /> Saved quizzes
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {editing ? (
            <form onSubmit={handleRename} className="flex items-center gap-2">
              <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={140} aria-label="Quiz title" className={cx(inputCls, "min-w-[260px] font-display text-lg")} />
              <Button type="submit" size="xs" aria-label="Save title"><Check size={16} /></Button>
              <Button variant="soft" size="xs" onClick={() => setEditing(false)} aria-label="Cancel"><X size={16} /></Button>
            </form>
          ) : (
            <h1 className="flex items-center gap-2 font-display text-[clamp(1.6rem,2.4vw,2.1rem)] font-semibold leading-tight tracking-tight">
              {quiz.title}
              <button type="button" onClick={() => { setDraft(quiz.title); setEditing(true); }} aria-label="Rename quiz" title="Rename" className="grid size-8 place-items-center rounded-lg text-soft hover:bg-primary-soft hover:text-primary">
                <Pencil size={16} />
              </button>
            </h1>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-soft">
            <Chip tone="primary">{quiz.topic}</Chip>
            <Chip tone="info">{quiz.difficulty}</Chip>
            <span>{quiz.questions.length} questions · created {formatDate(quiz.createdAt)}</span>
            {best >= 0 && <Chip tone={tone(best)}>Best {best}%</Chip>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => exportQuizPaper(quiz)}><FileDown size={16} /> Questions PDF</Button>
          <Button variant="ghost" size="sm" onClick={() => exportQuizPaper(quiz, { withAnswers: true })}><KeyRound size={16} /> With answers</Button>
          <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 size={16} /> Delete</Button>
        </div>
      </header>

      {error && <p role="alert" className="mb-4 rounded-xl border border-bad/35 bg-bad-bg px-4 py-3 text-sm text-bad">{error}</p>}

      <section className={panelCls}>
        <PanelBar icon={null} title={
          <span className="inline-flex gap-1" role="tablist">
            {TABS.map(([key, Icon, label]) => (
              <button
                key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.85rem] font-semibold transition",
                  tab === key ? "bg-linear-to-br from-primary via-blue-500 to-cyan text-white shadow-soft" : "text-soft hover:bg-primary-soft hover:text-primary"
                )}
              >
                <Icon size={15} /> {label}
                {key === "history" && attempts.length > 0 && <span className="rounded-full bg-black/10 px-1.5 text-xs">{attempts.length}</span>}
              </button>
            ))}
          </span>
        } />

        <div className="min-w-0 flex-1 p-5 sm:p-8 xl:p-10">
          {tab === "read" && (
            <>
              <p className="mx-auto mb-5 max-w-[920px] text-sm text-soft">
                Study view — correct answers and explanations are shown. Switch to <b>Take quiz</b> to test yourself.
              </p>
              <QuizReader quiz={quiz} />
            </>
          )}

          {tab === "take" && (
            <QuizPlayer key={playKey} quiz={quiz} onFinished={handleFinished} onNewQuiz={() => { setPlayKey((k) => k + 1); setTab("read"); }} />
          )}

          {tab === "history" && (
            attempts.length === 0 ? (
              <EmptyState icon={<History size={26} />} title="No attempts yet" hint="Take the quiz and your scores will be saved here.">
                <Button className="mt-3" onClick={() => setTab("take")}><PlayCircle size={17} /> Take the quiz</Button>
              </EmptyState>
            ) : (
              <ul className="m-0 mx-auto flex max-w-[920px] list-none flex-col gap-3 p-0">
                {attempts.map((a, i) => (
                  <li key={a.takenAt + i} className="flex animate-rise flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface2 px-5 py-4">
                    <div className="flex items-center gap-4">
                      <span className={cx("grid size-12 place-items-center rounded-full font-display text-lg font-bold", a.mcqTotal ? badgeCls[tone(a.percent)] : "bg-primary-soft text-primary")}>
                        {a.mcqTotal ? `${a.percent}%` : <Trophy size={20} />}
                      </span>
                      <div>
                        <div className="font-semibold">
                          {a.mcqTotal ? `${a.correct} of ${a.mcqTotal} correct` : "Short-answer attempt"}
                          {a.percent === best && attempts.length > 1 && <Chip tone="good"> Best</Chip>}
                        </div>
                        <div className="text-sm text-soft">
                          {formatDate(a.takenAt)} · {new Date(a.takenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {a.mode === "exam" ? "Exam" : "Practice"} mode
                          {a.skipped > 0 && ` · ${a.skipped} skipped`}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => exportQuizReport(quiz, a.answers || {})}>
                      <FileDown size={16} /> Detailed report PDF
                    </Button>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </section>
    </>
  );
}
