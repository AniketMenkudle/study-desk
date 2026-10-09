import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, FileDown, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { exportMarkdownPdf } from "../utils/pdf";
import { Button, cx } from "./ui";

export const panelCls = "flex min-h-[max(560px,calc(100vh-190px))] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lift";

export function PanelBar({ icon, title, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line bg-linear-to-r from-primary-soft to-transparent px-[18px] py-3">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
        {icon}
        {title}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function EmptyState({ icon, title, hint, children }) {
  return (
    <div className="mx-auto flex min-h-[380px] max-w-md flex-col items-center justify-center gap-2.5 text-center text-[0.95rem] text-soft">
      <div className="mb-1.5 grid size-[66px] animate-float place-items-center rounded-full bg-linear-to-br from-primary via-blue-500 to-cyan text-white shadow-xl shadow-blue-500/40">
        {icon || <Sparkles size={26} />}
      </div>
      <strong className="font-display text-xl text-ink">{title}</strong>
      <span>{hint}</span>
      {children}
    </div>
  );
}

function Skeleton({ w }) {
  return (
    <div
      className={cx("h-3.5 animate-shimmer rounded-lg bg-[length:200%_100%]", w)}
      style={{ backgroundImage: "linear-gradient(90deg, var(--c-primary-soft) 25%, var(--c-line) 50%, var(--c-primary-soft) 75%)" }}
    />
  );
}

export function LoadingBlock({ label }) {
  return (
    <div className="flex flex-col gap-3.5" aria-live="polite">
      <div className="mb-2 flex items-center gap-1.5 text-[0.92rem] font-semibold text-primary">
        <i className="size-[7px] animate-bounce-dot rounded-full bg-primary" />
        <i className="size-[7px] animate-bounce-dot rounded-full bg-primary [animation-delay:150ms]" />
        <i className="mr-1.5 size-[7px] animate-bounce-dot rounded-full bg-primary [animation-delay:300ms]" />
        {label}
      </div>
      {["w-[90%]", "w-full", "w-3/4", "w-[95%]", "w-3/5", "w-[85%]"].map((w) => (
        <Skeleton key={w} w={w} />
      ))}
    </div>
  );
}

export const proseCls =
  "prose max-w-[100ch] text-[1rem] leading-relaxed text-ink dark:prose-invert " +
  "prose-headings:font-display prose-headings:text-ink prose-h2:text-primary-dark prose-strong:text-ink " +
  "prose-a:text-primary prose-li:marker:text-primary prose-blockquote:rounded-r-xl prose-blockquote:border-primary " +
  "prose-blockquote:bg-primary-soft prose-blockquote:py-1 prose-blockquote:not-italic " +
  "prose-code:rounded-md prose-code:bg-primary-soft prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:text-primary-dark " +
  "prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[#14123a] prose-pre:text-[#e9e6ff] " +
  "prose-th:bg-primary-soft prose-th:px-3 prose-td:px-3 prose-h1:text-[1.9rem] prose-h1:leading-tight " +
  "[&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none";

/**
 * Shared output panel for every tab.
 * status: "idle" | "loading" | "done" | "error"
 *  - content="...markdown..." -> rendered Markdown with Copy + PDF buttons
 *  - children                 -> custom body (the quiz player), with `actions`
 */
export default function ResultPanel({
  status, content, children, actions, error, emptyTitle, emptyHint,
  loadingLabel = "Thinking…", pdfTitle = "Study answer", pdfSubtitle, expanded, onToggleExpand,
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  const showBar = status === "done" || onToggleExpand;

  return (
    <section className={panelCls}>
      {showBar && (
        <PanelBar icon={<Sparkles size={15} />} title={status === "done" ? "Result" : "Output"}>
          {status === "done" && content && (
            <>
              <Button variant="soft" size="xs" onClick={copy}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="soft" size="xs"
                onClick={() => exportMarkdownPdf({ title: pdfTitle, subtitle: pdfSubtitle, markdown: content })}
              >
                <FileDown size={15} /> PDF
              </Button>
            </>
          )}
          {status === "done" && actions}
          {onToggleExpand && (
            <Button variant="soft" size="xs" onClick={onToggleExpand} title={expanded ? "Show the form again" : "Give the output the full width"}>
              {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              {expanded ? "Shrink" : "Expand"}
            </Button>
          )}
        </PanelBar>
      )}

      <div className="min-w-0 flex-1 p-5 sm:p-8 xl:p-10">
        {status === "idle" && <EmptyState title={emptyTitle} hint={emptyHint} />}
        {status === "loading" && <LoadingBlock label={loadingLabel} />}
        {status === "error" && (
          <div className="rounded-xl border border-bad/35 bg-bad-bg px-[18px] py-4 text-[0.93rem] text-bad">
            {error || "Something went wrong. Please try again."}
          </div>
        )}
        {status === "done" && (
          <div className={cx("animate-rise", !children && proseCls)}>
            {children ?? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>}
          </div>
        )}
      </div>
    </section>
  );
}
