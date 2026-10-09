import { GraduationCap, ListChecks, BookMarked, FileDown, Sparkles } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { Sun, Moon } from "lucide-react";

const PERKS = [
  [Sparkles, "Ask anything", "Clear answers and notes at your level"],
  [ListChecks, "Interactive quizzes", "Click answers, get instant feedback"],
  [BookMarked, "Saved forever", "Every quiz is stored in your library"],
  [FileDown, "Detailed PDFs", "Download papers and answer reports"],
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  const { theme, toggleTheme } = useSettings();
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(380px,1fr)_minmax(420px,560px)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-[#16133f] via-[#2a1f86] to-[#1b5fd6] p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-cyan/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 size-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex items-center gap-3 font-display text-2xl font-bold">
          <span className="grid size-11 place-items-center rounded-xl bg-white/15 backdrop-blur"><GraduationCap size={24} /></span>
          Study Desk
        </div>
        <div className="relative">
          <h2 className="mb-3 font-display text-4xl font-semibold leading-tight">Study smarter,<br />not harder.</h2>
          <p className="mb-8 max-w-md text-white/75">Your personal AI study assistant — with quizzes that remember your progress.</p>
          <ul className="grid max-w-md gap-4">
            {PERKS.map(([Icon, head, text]) => (
              <li key={head} className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <span className="grid size-10 flex-none place-items-center rounded-xl bg-white/15"><Icon size={19} /></span>
                <div><div className="font-semibold">{head}</div><div className="text-sm text-white/70">{text}</div></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">© Study Desk</p>
      </aside>

      <main className="relative grid place-items-center px-5 py-10 sm:px-10">
        <button
          type="button" onClick={toggleTheme} aria-label="Toggle light / dark"
          className="absolute right-5 top-5 grid size-10 place-items-center rounded-xl border border-line bg-surface text-soft transition hover:text-primary"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="w-full max-w-md animate-rise">
          <div className="mb-8 flex items-center gap-2.5 font-display text-xl font-bold lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-primary via-blue-500 to-cyan text-white"><GraduationCap size={20} /></span>
            Study Desk
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mb-7 mt-1.5 text-soft">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-soft">{footer}</p>
        </div>
      </main>
    </div>
  );
}
