import { NavLink } from "react-router-dom";
import {
  MessageCircleQuestion, NotebookPen, ListChecks, BookMarked, BellRing,
  Sun, Moon, GraduationCap, LogOut,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { cx } from "./ui";

const NAV_ITEMS = [
  { to: "/", label: "Ask a question", icon: MessageCircleQuestion, end: true },
  { to: "/notes", label: "Notes & summaries", icon: NotebookPen },
  { to: "/quiz", label: "Quiz generator", icon: ListChecks },
  { to: "/library", label: "Saved quizzes", icon: BookMarked },
  { to: "/reminders", label: "Study reminders", icon: BellRing },
];

const MODELS = [
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (fast)" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite (lightest)" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview, deeper)" },
];

const label = "mb-1.5 block text-[0.78rem] text-white/80";
const select =
  "w-full rounded-[9px] border border-white/20 bg-white/10 px-2.5 py-2 text-[0.82rem] text-white focus:outline-none focus:ring-2 focus:ring-cyan/60";

export default function Sidebar() {
  const { model, setModel, temperature, setTemperature, studyMode, setStudyMode, theme, toggleTheme } = useSettings();
  const { user, logout } = useAuth();

  return (
    <aside className="flex flex-col gap-6 bg-linear-to-b from-[#16133f] via-[#221a68] to-[#2b1f86] px-[18px] py-6 text-[#eceaff] lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 font-display text-lg font-bold">
          <span className="grid size-[38px] place-items-center rounded-[11px] bg-linear-to-br from-primary via-blue-500 to-cyan text-white shadow-lg shadow-cyan/40">
            <GraduationCap size={20} />
          </span>
          <div className="leading-tight">
            Study Desk
            <small className="block font-sans text-[0.68rem] font-normal text-white/60">Your personal study assistant</small>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title="Toggle light / dark"
          className="grid size-[34px] place-items-center rounded-[10px] border border-white/20 bg-white/10 text-white transition hover:rotate-12 hover:scale-105 hover:bg-white/20"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <nav className="flex flex-row flex-wrap gap-1.5 lg:flex-col lg:flex-nowrap">
        {NAV_ITEMS.map(({ to, label: text, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.93rem] no-underline transition",
                isActive
                  ? "bg-linear-to-r from-primary/90 to-blue-500/60 text-white shadow-lg shadow-cyan/30"
                  : "text-white/75 hover:translate-x-0.5 hover:bg-white/10 hover:text-white"
              )
            }
          >
            <Icon size={18} />
            <span>{text}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-3.5 border-t border-white/15 pt-5 lg:mt-auto">
        <h3 className="text-[0.7rem] font-semibold uppercase tracking-widest text-white/55">Settings</h3>

        <div>
          <label htmlFor="model" className={label}>AI model</label>
          <select id="model" value={model} onChange={(e) => setModel(e.target.value)} className={select}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="temperature" className={label}>
            Creativity <span className="float-right text-xs font-semibold text-cyan">{temperature.toFixed(1)}</span>
          </label>
          <input
            id="temperature" type="range" min="0" max="1" step="0.1" value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="studyMode" className={label}>Study mode</label>
          <select id="studyMode" value={studyMode} onChange={(e) => setStudyMode(e.target.value)} className={select}>
            <option>Balanced</option>
            <option>Exam prep</option>
            <option>Deep understanding</option>
          </select>
        </div>

        {user && (
          <div className="mt-1 flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.07] p-2.5">
            <span className="grid size-9 flex-none place-items-center rounded-full bg-linear-to-br from-accent to-primary font-display font-bold text-white">
              {user.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="truncate text-[0.7rem] text-white/60">{user.email}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="grid size-8 flex-none place-items-center rounded-lg text-white/70 transition hover:bg-white/15 hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
