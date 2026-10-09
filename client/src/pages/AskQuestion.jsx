import { useState } from "react";
import { Send } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { askQuestion, errorMessage } from "../api/client";
import ResultPanel from "../components/ResultPanel";
import useExpand from "../hooks/useExpand";
import { Button, Field, FormPanel, PageHeader, Workspace, inputCls, submitOnCtrlEnter } from "../components/ui";

const EXAMPLES = [
  { subject: "Physics", question: "Why does the moon cause tides on Earth?" },
  { subject: "Python", question: "What is the difference between a list and a tuple?" },
  { subject: "Biology", question: "How does photosynthesis convert light into chemical energy?" },
  { subject: "Economics", question: "Explain inflation with a simple everyday example." },
];

export const chipBtn =
  "cursor-pointer rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1 text-[0.78rem] text-soft transition " +
  "hover:-translate-y-px hover:border-solid hover:border-primary hover:bg-primary-soft hover:text-primary";

export default function AskQuestion() {
  const { model, temperature, studyMode } = useSettings();
  const [expanded, toggleExpand] = useExpand();

  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [level, setLevel] = useState("School");
  const [style, setStyle] = useState("Step-by-step");

  const [status, setStatus] = useState("idle");
  const [answer, setAnswer] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [asked, setAsked] = useState({ subject: "", question: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim()) return setWarning("Please enter a question.");
    setWarning("");
    setError("");
    setStatus("loading");
    try {
      const { answer } = await askQuestion({ subject, question, level, style, model, temperature, studyMode });
      setAnswer(answer);
      setAsked({ subject, question });
      setStatus("done");
    } catch (err) {
      setError(errorMessage(err, ""));
      setStatus("error");
    }
  }

  const form = (
    <FormPanel onSubmit={handleSubmit} onKeyDown={submitOnCtrlEnter}>
      <div className="flex flex-wrap gap-[7px]" aria-label="Example questions">
        {EXAMPLES.map((ex) => (
          <button type="button" key={ex.question} className={chipBtn} onClick={() => { setSubject(ex.subject); setQuestion(ex.question); }}>
            {ex.subject}
          </button>
        ))}
      </div>

      <Field label="Subject / topic (optional)" htmlFor="subject">
        <input id="subject" type="text" className={inputCls} placeholder="e.g., Calculus, World War II, Python" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>

      <Field label="Your question" htmlFor="question" right={<span className="text-xs font-normal opacity-70">{question.length}</span>}>
        <textarea id="question" className={`${inputCls} min-h-[120px] resize-y leading-normal`} placeholder="Type your question here…" value={question} onChange={(e) => setQuestion(e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Level" htmlFor="level">
          <select id="level" className={inputCls} value={level} onChange={(e) => setLevel(e.target.value)}>
            <option>School</option><option>Undergraduate</option><option>Graduate</option><option>General</option>
          </select>
        </Field>
        <Field label="Explanation style" htmlFor="style">
          <select id="style" className={inputCls} value={style} onChange={(e) => setStyle(e.target.value)}>
            <option>Simple</option><option>Detailed</option><option>Step-by-step</option>
          </select>
        </Field>
      </div>

      {warning && <p className="text-sm text-bad">{warning}</p>}

      <Button type="submit" disabled={status === "loading"}>
        <Send size={16} /> {status === "loading" ? "Thinking…" : "Get answer"}
      </Button>
      <p className="-mt-1.5 text-center text-xs text-soft">Tip: press Ctrl/⌘ + Enter to send</p>
    </FormPanel>
  );

  return (
    <>
      <PageHeader kicker="Ask questions" title="Ask any study question" />
      <Workspace expanded={expanded} form={form}>
        <ResultPanel
          status={status} content={answer} error={error}
          pdfTitle={asked.question || "Study answer"}
          pdfSubtitle={asked.subject ? `Subject: ${asked.subject}` : undefined}
          expanded={expanded} onToggleExpand={toggleExpand}
          emptyTitle="Your answer will appear here"
          emptyHint="Ask about any topic — the explanation adapts to the level and style you choose."
        />
      </Workspace>
    </>
  );
}
