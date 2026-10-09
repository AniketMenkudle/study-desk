import { useState } from "react";
import { Wand2 } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { summarizeText, generateNotes, errorMessage } from "../api/client";
import ResultPanel from "../components/ResultPanel";
import useExpand from "../hooks/useExpand";
import { Button, Field, FormPanel, PageHeader, Workspace, inputCls, submitOnCtrlEnter, cx } from "../components/ui";

export default function NotesSummaries() {
  const { model, temperature, studyMode } = useSettings();
  const [expanded, toggleExpand] = useExpand();
  const [mode, setMode] = useState("summarize"); // "summarize" | "notes"

  const [text, setText] = useState("");
  const [summaryLength, setSummaryLength] = useState("Short");
  const [highlight, setHighlight] = useState(true);

  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState("Standard");

  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (mode === "summarize" && !text.trim()) return setWarning("Please paste some text to summarize.");
    if (mode === "notes" && !topic.trim()) return setWarning("Please enter a topic.");

    setWarning("");
    setError("");
    setStatus("loading");
    try {
      if (mode === "summarize") {
        const { summary } = await summarizeText({ text, summaryLength, highlight, model, temperature, studyMode });
        setResult(summary);
      } else {
        const { notes } = await generateNotes({ topic, depth, model, temperature, studyMode });
        setResult(notes);
      }
      setStatus("done");
    } catch (err) {
      setError(errorMessage(err, ""));
      setStatus("error");
    }
  }

  const form = (
    <FormPanel onSubmit={handleSubmit} onKeyDown={submitOnCtrlEnter}>
      <div className="flex gap-[3px] rounded-xl border-[1.5px] border-line bg-surface2 p-[3px]">
        {[["summarize", "Summarize my text"], ["notes", "Topic → structured notes"]].map(([key, text]) => (
          <button
            key={key} type="button" onClick={() => setMode(key)}
            className={cx(
              "flex-1 rounded-[9px] px-2 py-2.5 text-[0.8rem] font-medium transition",
              mode === key ? "bg-linear-to-br from-primary via-blue-500 to-cyan text-white shadow-soft" : "text-soft"
            )}
          >
            {text}
          </button>
        ))}
      </div>

      {mode === "summarize" ? (
        <>
          <Field label="Paste your study material" htmlFor="text">
            <textarea id="text" className={`${inputCls} min-h-40 resize-y leading-normal`} placeholder="Paste textbook pages, lecture notes, or long explanations here..." value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 items-end gap-3">
            <Field label="Summary length" htmlFor="summaryLength">
              <select id="summaryLength" className={inputCls} value={summaryLength} onChange={(e) => setSummaryLength(e.target.value)}>
                <option>Very short (bullet points)</option><option>Short</option><option>Medium</option><option>Detailed</option>
              </select>
            </Field>
            <label htmlFor="highlight" className="flex items-center gap-2 pb-3 text-sm">
              <input id="highlight" type="checkbox" className="size-4" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} />
              Highlight key terms
            </label>
          </div>
        </>
      ) : (
        <>
          <Field label="Topic" htmlFor="topic">
            <input id="topic" type="text" className={inputCls} placeholder="e.g., Neural Networks, French Revolution, Chemical Bonding" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </Field>
          <Field label="Depth" htmlFor="depth">
            <select id="depth" className={inputCls} value={depth} onChange={(e) => setDepth(e.target.value)}>
              <option>Overview</option><option>Standard</option><option>In-depth</option>
            </select>
          </Field>
        </>
      )}

      {warning && <p className="text-sm text-bad">{warning}</p>}

      <Button type="submit" disabled={status === "loading"}>
        <Wand2 size={16} />
        {status === "loading" ? "Generating…" : mode === "summarize" ? "Generate summary" : "Generate topic notes"}
      </Button>
    </FormPanel>
  );

  return (
    <>
      <PageHeader kicker="Notes & summaries" title="Create notes and summaries" />
      <Workspace expanded={expanded} form={form}>
        <ResultPanel
          status={status} content={result} error={error}
          pdfTitle={mode === "notes" ? `Notes: ${topic}` : "Summary"}
          pdfSubtitle={mode === "notes" ? `Depth: ${depth}` : `Length: ${summaryLength}`}
          expanded={expanded} onToggleExpand={toggleExpand}
          emptyTitle="Your notes will appear here"
          emptyHint="Paste material to summarize, or give a topic to turn into structured notes."
        />
      </Workspace>
    </>
  );
}
