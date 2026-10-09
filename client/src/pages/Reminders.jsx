import { useEffect, useState } from "react";
import { Plus, Trash2, CalendarClock, AlarmClockOff } from "lucide-react";
import { getReminders, addReminder, toggleReminder, deleteReminder, clearReminders } from "../api/client";
import { Button, Field, FormPanel, PageHeader, Workspace, inputCls, cx } from "../components/ui";
import { EmptyState, PanelBar, panelCls } from "../components/ResultPanel";

// Local date (toISOString() is UTC and can show "tomorrow"/"yesterday")
function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function isOverdue(r) {
  if (r.completed) return false;
  const when = new Date(`${r.date}T${r.time || "00:00"}`);
  return !Number.isNaN(when.getTime()) && when < new Date();
}

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [text, setText] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("18:00");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    getReminders()
      .then(setReminders)
      .catch(() => setReminders([]))
      .finally(() => setLoaded(true));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!text.trim()) return setWarning("Please enter a reminder.");
    setWarning("");
    try {
      const created = await addReminder({ text, date, time });
      setReminders((prev) => [...prev, created]);
      setText("");
    } catch {
      setWarning("Couldn't save the reminder. Is the server running?");
    }
  }

  async function handleToggle(id) {
    try {
      const updated = await toggleReminder(id);
      setReminders((prev) => prev.map((r) => (r._id === id ? updated : r)));
    } catch {
      setWarning("Couldn't update that reminder.");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r._id !== id));
    } catch {
      setWarning("Couldn't remove that reminder.");
    }
  }

  async function handleClearAll() {
    try {
      await clearReminders();
      setReminders([]);
    } catch {
      setWarning("Couldn't clear reminders.");
    }
  }

  const form = (
    <FormPanel onSubmit={handleAdd}>
      <Field label="Reminder text" htmlFor="reminderText">
        <input id="reminderText" type="text" className={inputCls} placeholder="e.g., Revise chapter 3, practice 10 problems" value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Target date" htmlFor="reminderDate">
          <input id="reminderDate" type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Target time" htmlFor="reminderTime">
          <input id="reminderTime" type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      {warning && <p className="text-sm text-bad">{warning}</p>}
      <Button type="submit"><Plus size={16} /> Add reminder</Button>
    </FormPanel>
  );

  return (
    <>
      <PageHeader kicker="Study reminders" title="Set and view study reminders" />
      <Workspace form={form}>
        <section className={panelCls}>
          <PanelBar icon={<CalendarClock size={15} />} title="Your reminders">
            {reminders.length > 0 && (
              <Button variant="soft" size="xs" onClick={handleClearAll}><Trash2 size={15} /> Clear all</Button>
            )}
          </PanelBar>
          <div className="flex-1 p-5 sm:p-8 xl:p-10">
            {!loaded ? (
              <p className="text-sm italic text-soft">Loading…</p>
            ) : reminders.length === 0 ? (
              <EmptyState icon={<AlarmClockOff size={26} />} title="No reminders yet" hint="Add one on the left to get started." />
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {reminders.map((r) => {
                  const overdue = isOverdue(r);
                  return (
                    <li
                      key={r._id}
                      className={cx(
                        "flex animate-rise items-center justify-between gap-3 rounded-[13px] border-[1.5px] px-4 py-3 transition hover:translate-x-0.5",
                        overdue ? "border-bad bg-bad-bg" : "border-line bg-surface2 hover:border-primary",
                        r.completed && "opacity-60"
                      )}
                    >
                      <label className="flex flex-1 cursor-pointer items-center gap-3">
                        <input type="checkbox" className="size-[18px]" checked={r.completed} onChange={() => handleToggle(r._id)} />
                        <span>
                          <span className={cx("block text-[0.97rem] font-medium", r.completed && "line-through")}>{r.text}</span>
                          <span className="mt-0.5 block text-[0.78rem] text-soft">
                            {r.date} at {r.time}
                            {overdue && <b className="ml-2 rounded-full bg-bad px-2 py-px text-[0.7rem] text-white">Overdue</b>}
                          </span>
                        </span>
                      </label>
                      <button type="button" onClick={() => handleDelete(r._id)} aria-label="Remove reminder" className="grid place-items-center rounded-lg p-1.5 text-soft transition hover:bg-bad-bg hover:text-bad">
                        <Trash2 size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </Workspace>
    </>
  );
}
