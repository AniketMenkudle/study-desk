import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookMarked, Search, Trash2, ListChecks, Trophy, Clock, HelpCircle, Plus } from "lucide-react";
import { listQuizzes, deleteQuiz, errorMessage } from "../api/client";
import { Button, ButtonLink, Chip, PageHeader, formatDate, inputCls, cx } from "../components/ui";
import { EmptyState, LoadingBlock } from "../components/ResultPanel";

const diffTone = { Easy: "good", Medium: "info", Hard: "bad", Mixed: "primary" };

function scoreTone(p) {
  return p >= 70 ? "text-good" : p >= 40 ? "text-warn" : "text-bad";
}

export default function SavedQuizzes() {
  const [quizzes, setQuizzes] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    listQuizzes().then(setQuizzes).catch((err) => { setError(errorMessage(err)); setQuizzes([]); });
  }, []);

  const shown = useMemo(() => {
    if (!quizzes) return [];
    const q = query.trim().toLowerCase();
    const filtered = quizzes.filter((x) => !q || `${x.title} ${x.topic} ${x.difficulty}`.toLowerCase().includes(q));
    const sorters = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      best: (a, b) => (b.bestPercent ?? -1) - (a.bestPercent ?? -1),
      title: (a, b) => a.title.localeCompare(b.title),
    };
    return [...filtered].sort(sorters[sort]);
  }, [quizzes, query, sort]);

  async function handleDelete(quiz) {
    if (!window.confirm(`Delete "${quiz.title}" and all its results? This can't be undone.`)) return;
    setBusyId(quiz._id);
    try {
      await deleteQuiz(quiz._id);
      setQuizzes((list) => list.filter((x) => x._id !== quiz._id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader kicker="Library" title="Your saved quizzes">
        <ButtonLink to="/quiz" size="sm"><Plus size={16} /> New quiz</ButtonLink>
      </PageHeader>

      {error && <p role="alert" className="mb-4 rounded-xl border border-bad/35 bg-bad-bg px-4 py-3 text-sm text-bad">{error}</p>}

      {quizzes === null ? (
        <div className="rounded-2xl border border-line bg-surface p-8"><LoadingBlock label="Loading your library…" /></div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 shadow-lift">
          <EmptyState icon={<BookMarked size={26} />} title="No saved quizzes yet" hint="Every quiz you generate is saved here automatically so you can read or retake it any time.">
            <ButtonLink to="/quiz" className="mt-3"><ListChecks size={17} /> Generate your first quiz</ButtonLink>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 sm:max-w-md">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-soft" />
              <input
                type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, topic or difficulty…" aria-label="Search quizzes" className={cx(inputCls, "pl-10")}
              />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort quizzes" className={cx(inputCls.replace("w-full", ""), "w-auto")}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="best">Best score</option>
              <option value="title">Title A–Z</option>
            </select>
            <span className="text-sm text-soft">{shown.length} of {quizzes.length}</span>
          </div>

          {shown.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-8 text-center text-soft">No quizzes match "{query}".</p>
          ) : (
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-5 p-0">
              {shown.map((q, i) => (
                <li
                  key={q._id}
                  style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                  className="group flex animate-rise flex-col rounded-2xl border border-line bg-surface p-5 shadow-soft transition hover:-translate-y-1 hover:border-primary hover:shadow-lift"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <Link to={`/library/${q._id}`} className="min-w-0 no-underline">
                      <h3 className="font-display text-[1.1rem] font-semibold leading-snug text-ink group-hover:text-primary">{q.title}</h3>
                      <p className="mt-0.5 truncate text-sm text-soft">{q.topic}</p>
                    </Link>
                    <Chip tone={diffTone[q.difficulty] || "info"}>{q.difficulty}</Chip>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.82rem] text-soft">
                    <span className="inline-flex items-center gap-1.5"><HelpCircle size={15} /> {q.questionCount} questions</span>
                    <span className="inline-flex items-center gap-1.5"><ListChecks size={15} /> {q.attemptCount} {q.attemptCount === 1 ? "attempt" : "attempts"}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock size={15} /> {formatDate(q.createdAt)}</span>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
                    {q.bestPercent === null ? (
                      <span className="text-sm text-soft">Not attempted yet</span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm">
                        <Trophy size={16} className={scoreTone(q.bestPercent)} />
                        Best <b className={scoreTone(q.bestPercent)}>{q.bestPercent}%</b>
                        <span className="text-soft">· Last {q.lastPercent}%</span>
                      </span>
                    )}
                    <div className="flex gap-2">
                      <Button variant="soft" size="xs" onClick={() => handleDelete(q)} disabled={busyId === q._id} aria-label={`Delete ${q.title}`} title="Delete quiz">
                        <Trash2 size={15} />
                      </Button>
                      <ButtonLink to={`/library/${q._id}`} size="sm">Open</ButtonLink>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
