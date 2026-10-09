import { useState } from "react";
import { Link } from "react-router-dom";
import { Wand2, BookMarked, CloudOff } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { generateQuiz, saveAttempt, errorMessage } from "../api/client";
import ResultPanel from "../components/ResultPanel";
import QuizPlayer from "../components/QuizPlayer";
import useExpand from "../hooks/useExpand";
import { Button, Field, FormPanel, PageHeader, Workspace, inputCls, submitOnCtrlEnter } from "../components/ui";
import { chipBtn } from "./AskQuestion";

const TOPICS = ["Photosynthesis", "Data Structures", "World War I", "Newton's Laws", "Operating Systems"];

export default function QuizGenerator() {
  const { model, temperature, studyMode } = useSettings();
  const [expanded, toggleExpand] = useExpand();

  const [quizTopic, setQuizTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizType, setQuizType] = useState("Multiple choice");
  const [difficulty, setDifficulty] = useState("Medium");

  const [status, setStatus] = useState("idle");
  const [quiz, setQuiz] = useState(null);
  const [saved, setSaved] = useState(true);
  const [quizKey, setQuizKey] = useState(0); // fresh QuizPlayer for every new quiz
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!quizTopic.trim()) return setWarning("Please enter a quiz topic.");
    setWarning("");
    setError("");
    setStatus("loading");
    try {
      const data = await generateQuiz({ quizTopic, numQuestions, quizType, difficulty, model, temperature, studyMode });
      setQuiz(data.quiz);
      setSaved(data.saved !== false);
      setQuizKey((k) => k + 1);
      setStatus("done");
    } catch (err) {
      setError(errorMessage(err, ""));
      setStatus("error");
    }
  }

  const form = (
    <FormPanel onSubmit={handleSubmit} onKeyDown={submitOnCtrlEnter}>
      <div className="flex flex-wrap gap-[7px]" aria-label="Example topics">
        {TOPICS.map((t) => (
          <button type="button" key={t} className={chipBtn} onClick={() => setQuizTopic(t)}>{t}</button>
        ))}
      </div>

      <Field label="Quiz topic" htmlFor="quizTopic">
        <input id="quizTopic" type="text" className={inputCls} placeholder="e.g., Photosynthesis, Data Structures, World War I" value={quizTopic} onChange={(e) => setQuizTopic(e.target.value)} />
      </Field>

      <Field label="Number of questions" htmlFor="numQuestions" right={<span className="text-xs font-semibold text-primary">{numQuestions}</span>}>
        <input id="numQuestions" type="range" min="3" max="20" value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Quiz type" htmlFor="quizType">
          <select id="quizType" className={inputCls} value={quizType} onChange={(e) => setQuizType(e.target.value)}>
            <option>Multiple choice</option><option>Short answer</option><option>Mixed</option>
          </select>
        </Field>
        <Field label="Difficulty" htmlFor="difficulty">
          <select id="difficulty" className={inputCls} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option>Easy</option><option>Medium</option><option>Hard</option><option>Mixed</option>
          </select>
        </Field>
      </div>

      {warning && <p className="text-sm text-bad">{warning}</p>}

      <Button type="submit" disabled={status === "loading"}>
        <Wand2 size={16} /> {status === "loading" ? "Creating…" : "Generate quiz"}
      </Button>
      <p className="-mt-1.5 text-center text-xs text-soft">Quizzes are saved automatically to your library</p>
    </FormPanel>
  );

  return (
    <>
      <PageHeader kicker="Quizzes" title="Generate an interactive quiz" />
      <Workspace expanded={expanded} form={form}>
        <ResultPanel
          status={status} error={error} loadingLabel="Writing your questions…"
          expanded={expanded} onToggleExpand={toggleExpand}
          emptyTitle="Your quiz will appear here"
          emptyHint="Pick a topic and difficulty. You'll click answers, see your score, and download a detailed PDF."
        >
          {quiz && (
            <>
              <div className="mx-auto mb-4 flex max-w-[920px] flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface2 px-4 py-2.5 text-sm">
                {saved ? (
                  <>
                    <span className="inline-flex items-center gap-2 text-good"><BookMarked size={16} /> Saved to your library — read it any time.</span>
                    <Link to={`/library/${quiz._id}`} className="font-semibold text-primary hover:underline">Open saved copy →</Link>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-2 text-warn"><CloudOff size={16} /> This quiz couldn't be saved, but you can still take it.</span>
                )}
              </div>
              <QuizPlayer
                key={quizKey}
                quiz={quiz}
                onNewQuiz={() => setStatus("idle")}
                onFinished={saved ? (answers, mode) => saveAttempt(quiz._id, { answers, mode }) : undefined}
              />
            </>
          )}
        </ResultPanel>
      </Workspace>
    </>
  );
}
