import { useMemo, useState } from "react";
import {
  Check, X, RotateCcw, FileDown, FileText, KeyRound, Zap, ClipboardCheck, Trophy, Eye, CloudOff, Loader2,
} from "lucide-react";
import { exportQuizPaper, exportQuizReport, scoreQuiz, questionStatus } from "../utils/pdf";
import ScoreRing from "./ScoreRing";
import { Button, Chip, cx } from "./ui";

const LETTERS = "ABCDEFGH";

export function QuestionCard({ index, q, className, style, children }) {
  return (
    <li className={cx("animate-rise rounded-2xl border-[1.5px] bg-surface px-[22px] pb-[18px] pt-5 transition hover:shadow-soft", className)} style={style}>
      <div className="mb-4 flex items-start gap-3.5">
        <span className="grid size-[34px] flex-none place-items-center rounded-[10px] bg-linear-to-br from-primary via-blue-500 to-cyan font-display font-bold text-white">
          {index + 1}
        </span>
        <h3 className="pt-0.5 font-display text-[1.08rem] font-medium leading-relaxed">{q.question}</h3>
      </div>
      {children}
    </li>
  );
}

export const Explain = ({ children }) => (
  <div className="mt-3.5 animate-rise rounded-xl border-l-4 border-info bg-info-bg px-4 py-3 text-[0.92rem] leading-relaxed">
    <b className="text-info">Why?</b> {children}
  </div>
);

const optionBase =
  "flex w-full items-center gap-3 rounded-[13px] border-[1.5px] px-4 py-3 text-left text-[0.97rem] leading-snug transition";
const letterBase = "grid size-[30px] flex-none place-items-center rounded-full border-[1.5px] text-[0.85rem] font-bold transition";

const optionStyles = {
  idle: ["border-line bg-surface2 text-ink enabled:hover:translate-x-1 enabled:hover:border-primary enabled:hover:bg-primary-soft", "border-line-strong bg-surface text-soft"],
  picked: ["border-primary bg-primary-soft ring-4 ring-primary/20", "border-primary bg-primary text-white"],
  right: ["animate-pop border-good bg-good-bg", "border-good bg-good text-white"],
  wrong: ["animate-shake border-bad bg-bad-bg", "border-bad bg-bad text-white"],
  dim: ["border-line bg-surface2 opacity-55", "border-line-strong bg-surface text-soft"],
};

export function Option({ state = "idle", letter, children, mark, ...props }) {
  const [box, circle] = optionStyles[state];
  return (
    <button type="button" className={cx(optionBase, box, "disabled:cursor-default")} {...props}>
      <span className={cx(letterBase, circle)}>{letter}</span>
      <span className="flex-1">{children}</span>
      {mark === "right" && <Check className="flex-none text-good" size={18} />}
      {mark === "wrong" && <X className="flex-none text-bad" size={18} />}
    </button>
  );
}

const cardBorder = { correct: "border-good", wrong: "border-bad", skipped: "border-warn", short: "border-line", idle: "border-line" };

/**
 * Interactive quiz.
 *  - Practice: click an option -> instant right/wrong + explanation.
 *  - Exam:     pick (and change) answers, then Submit.
 * `onFinished(answers, mode)` lets the parent save the attempt (to MongoDB).
 */
export default function QuizPlayer({ quiz, onNewQuiz, onFinished }) {
  const [mode, setMode] = useState("practice");
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [finished, setFinished] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

  const total = quiz.questions.length;
  const mcqCount = quiz.questions.filter((q) => q.type === "mcq").length;
  const answeredMcq = quiz.questions.filter((q, i) => q.type === "mcq" && answers[i] !== undefined).length;
  const started = Object.keys(answers).length > 0 || Object.keys(revealed).length > 0;
  const score = useMemo(() => scoreQuiz(quiz, answers), [quiz, answers]);
  const progress = mcqCount ? (answeredMcq / mcqCount) * 100 : (Object.keys(revealed).length / total) * 100;

  function pick(i, k) {
    if (finished) return;
    if (mode === "practice") {
      if (revealed[i]) return;
      setAnswers((a) => ({ ...a, [i]: k }));
      setRevealed((r) => ({ ...r, [i]: true }));
    } else {
      setAnswers((a) => ({ ...a, [i]: k }));
    }
  }

  const isOpen = (i) => finished || revealed[i];

  function reset() {
    setAnswers({});
    setRevealed({});
    setFinished(false);
    setSaveState("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function finish() {
    const unanswered = mcqCount - answeredMcq;
    if (unanswered > 0 && !window.confirm(`${unanswered} question(s) are unanswered. Submit anyway?`)) return;
    setFinished(true);
    setTimeout(() => document.getElementById("quiz-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    if (onFinished) {
      setSaveState("saving");
      try {
        await onFinished(answers, mode);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }
  }

  return (
    <div className="mx-auto max-w-[920px]">
      {/* ---------- sticky control bar ---------- */}
      <div className="sticky top-0 z-10 mb-5 rounded-[14px] border border-line bg-surface/90 px-4 pb-3 pt-3.5 shadow-soft backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <strong className="block font-display text-[1.05rem]">{quiz.title}</strong>
            <span className="text-[0.78rem] text-soft">{quiz.difficulty} · {total} questions</span>
          </div>
          <div className="inline-flex gap-0.5 rounded-[10px] border border-line bg-surface2 p-[3px]" role="group" aria-label="Quiz mode">
            {[["practice", Zap, "Practice", "See right/wrong immediately after every click"], ["exam", ClipboardCheck, "Exam", "Answer everything first, then submit"]].map(([key, Icon, text, tip]) => (
              <button
                key={key} type="button" title={tip} disabled={started} onClick={() => setMode(key)}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.8rem] font-semibold transition",
                  mode === key ? "bg-linear-to-br from-primary via-blue-500 to-cyan text-white" : "text-soft",
                  started && mode !== key && "cursor-not-allowed opacity-45"
                )}
              >
                <Icon size={14} /> {text}
              </button>
            ))}
          </div>
        </div>
        <div className="my-3 mb-2 h-[7px] overflow-hidden rounded-full bg-primary-soft">
          <i className="block h-full rounded-full bg-linear-to-r from-primary via-blue-500 to-cyan transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-[0.82rem] text-soft">
          <span>
            {mcqCount ? `${answeredMcq}/${mcqCount} answered` : `${Object.keys(revealed).length}/${total} checked`}
            {mode === "practice" && answeredMcq > 0 && mcqCount > 0 && <b className="text-good"> · {score.correct} correct</b>}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="soft" size="xs" onClick={() => exportQuizPaper(quiz)} title="Download the questions as a printable PDF">
              <FileDown size={15} /> Download MCQs
            </Button>
            {!finished && (
              <Button size="sm" onClick={finish} disabled={!started}>
                {mode === "exam" ? "Submit quiz" : "Finish & see results"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ---------- results ---------- */}
      {finished && (
        <div id="quiz-results" className="mb-5 scroll-mt-40 animate-pop rounded-[18px] border-[1.5px] border-primary bg-surface p-6 shadow-lift">
          <div className="flex flex-wrap items-center gap-6">
            {mcqCount > 0 ? (
              <ScoreRing percent={score.percent} />
            ) : (
              <div className="grid size-[90px] place-items-center rounded-full bg-linear-to-br from-primary via-blue-500 to-cyan text-white"><Trophy size={44} /></div>
            )}
            <div>
              <h2 className="mb-1 font-display text-2xl font-semibold">
                {mcqCount > 0 ? `You got ${score.correct} of ${score.mcqTotal} right` : "Quiz complete"}
              </h2>
              <p className="mb-3 text-soft">
                {mcqCount === 0 ? "Compare your answers with the model answers below."
                  : score.percent >= 85 ? "Excellent! You clearly know this topic."
                  : score.percent >= 70 ? "Good job — a quick revision and you're there."
                  : score.percent >= 40 ? "Decent start. Read the explanations below and try again."
                  : "Don't worry — go through the explanations and retry."}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="good">{score.correct} correct</Chip>
                <Chip tone="bad">{score.wrong} wrong</Chip>
                {score.skipped > 0 && <Chip tone="warn">{score.skipped} skipped</Chip>}
                {score.shortTotal > 0 && <Chip tone="info">{score.shortTotal} short answer</Chip>}
                {saveState === "saving" && <span className="inline-flex items-center gap-1 text-xs text-soft"><Loader2 size={14} className="animate-spin" /> Saving…</span>}
                {saveState === "saved" && <span className="inline-flex items-center gap-1 text-xs font-semibold text-good"><Check size={15} /> Result saved to your library</span>}
                {saveState === "error" && <span className="inline-flex items-center gap-1 text-xs font-semibold text-bad"><CloudOff size={15} /> Couldn't save this result</span>}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5 border-t border-line pt-[18px]">
            <Button onClick={() => exportQuizReport(quiz, answers)}><FileDown size={17} /> Detailed answers PDF</Button>
            <Button variant="ghost" size="sm" onClick={() => exportQuizPaper(quiz, { withAnswers: true })}><KeyRound size={16} /> Questions + answer key</Button>
            <Button variant="ghost" size="sm" onClick={reset}><RotateCcw size={16} /> Retry</Button>
            {onNewQuiz && <Button variant="ghost" size="sm" onClick={onNewQuiz}><FileText size={16} /> New quiz</Button>}
          </div>
        </div>
      )}

      {/* ---------- questions ---------- */}
      <ol className="m-0 flex list-none flex-col gap-[18px] p-0">
        {quiz.questions.map((q, i) => {
          const open = isOpen(i);
          const status = questionStatus(q, answers[i]);
          return (
            <QuestionCard
              key={i} index={i} q={q}
              className={open ? cardBorder[status] : "border-line"}
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              {q.type === "mcq" ? (
                <div className="grid gap-2.5" role="radiogroup" aria-label={`Question ${i + 1}`}>
                  {q.options.map((opt, k) => {
                    const picked = answers[i] === k;
                    const isRight = k === q.correctIndex;
                    let state = "idle";
                    if (open) state = isRight ? "right" : picked ? "wrong" : "dim";
                    else if (picked) state = "picked";
                    return (
                      <Option
                        key={k} state={state} letter={LETTERS[k]} role="radio" aria-checked={picked}
                        mark={open && isRight ? "right" : open && picked && !isRight ? "wrong" : null}
                        onClick={() => pick(i, k)}
                        disabled={finished || (mode === "practice" && revealed[i])}
                      >
                        {opt}
                      </Option>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-2.5">
                  <textarea
                    placeholder="Type your answer here…"
                    value={answers[i] || ""}
                    disabled={finished}
                    onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                    className="min-h-[90px] w-full resize-y rounded-xl border-[1.5px] border-line bg-surface2 px-3.5 py-2.5 text-[0.95rem] focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
                  />
                  {!open && (
                    <Button variant="ghost" size="sm" onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}>
                      <Eye size={15} /> Reveal model answer
                    </Button>
                  )}
                  {open && (
                    <div className="w-full rounded-xl border-l-4 border-good bg-good-bg px-4 py-3 text-[0.93rem]">
                      <b className="text-good">Model answer:</b> {q.answer}
                    </div>
                  )}
                </div>
              )}

              {open && q.type === "mcq" && status === "skipped" && (
                <p className="mt-3 text-sm font-semibold text-warn">You didn't answer this one.</p>
              )}
              {open && q.explanation && <Explain>{q.explanation}</Explain>}
            </QuestionCard>
          );
        })}
      </ol>

      {!finished && (
        <div className="mt-6 flex justify-center">
          <Button onClick={finish} disabled={!started}>{mode === "exam" ? "Submit quiz" : "Finish & see results"}</Button>
        </div>
      )}
    </div>
  );
}
