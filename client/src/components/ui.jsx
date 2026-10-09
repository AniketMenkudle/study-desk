import { Link } from "react-router-dom";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

/* Shared Tailwind class recipes so every form looks the same. */
export const inputCls =
  "w-full rounded-xl border-[1.5px] border-line bg-surface2 px-3 py-2.5 text-[0.93rem] text-ink " +
  "placeholder:text-soft/60 transition focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/20";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition duration-150 select-none " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none";

const variants = {
  primary:
    "rounded-xl bg-linear-to-br from-primary via-blue-500 to-cyan text-white shadow-lg shadow-primary/40 " +
    "hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:hover:translate-y-0",
  ghost:
    "rounded-xl border-[1.5px] border-line bg-surface text-ink font-medium hover:-translate-y-px hover:border-primary hover:text-primary",
  soft:
    "rounded-[9px] border border-line bg-surface2 text-soft font-medium hover:border-primary hover:bg-primary-soft hover:text-primary",
  danger:
    "rounded-xl border-[1.5px] border-bad/40 bg-bad-bg text-bad font-medium hover:border-bad",
};
const sizes = { md: "px-[18px] py-3 text-[0.93rem]", sm: "px-3.5 py-2 text-[0.82rem]", xs: "px-2.5 py-1.5 text-[0.8rem]" };

export function Button({ variant = "primary", size = "md", className, ...props }) {
  return <button type="button" className={cx(base, variants[variant], sizes[size], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", size = "md", className, ...props }) {
  return <Link className={cx(base, variants[variant], sizes[size], className)} {...props} />;
}

export function Field({ label, htmlFor, right, children, className }) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="flex justify-between text-[0.82rem] font-semibold text-soft">
        {label}
        {right}
      </label>
      {children}
    </div>
  );
}

export function PageHeader({ kicker, title, children }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2.5 inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {kicker}
        </p>
        <h1 className="font-display text-[clamp(1.7rem,2.6vw,2.25rem)] font-semibold leading-tight tracking-tight">{title}</h1>
      </div>
      {children}
    </header>
  );
}

/** Left form column + big output column. `expanded` hides the form. */
export function Workspace({ expanded, form, children }) {
  return (
    <div className={cx("grid items-start gap-6", expanded ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[minmax(310px,380px)_minmax(0,1fr)]")}>
      {!expanded && form}
      {children}
    </div>
  );
}

export function FormPanel({ className, ...props }) {
  return (
    <form
      className={cx("flex flex-col gap-4 rounded-2xl border border-line bg-surface p-[22px] shadow-soft lg:sticky lg:top-6", className)}
      {...props}
    />
  );
}

export function Chip({ tone = "info", children }) {
  const tones = {
    good: "bg-good-bg text-good",
    bad: "bg-bad-bg text-bad",
    warn: "bg-warn-bg text-warn",
    info: "bg-info-bg text-info",
    primary: "bg-primary-soft text-primary",
  };
  return <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export const submitOnCtrlEnter = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") e.currentTarget.requestSubmit();
};

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
