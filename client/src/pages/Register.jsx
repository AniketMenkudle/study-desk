import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, Loader2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { Button, Field, inputCls, cx } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api/client";

function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0-4
}
const STRENGTH = [["Too short", "bg-bad"], ["Weak", "bg-bad"], ["Okay", "bg-warn"], ["Good", "bg-good"], ["Strong", "bg-good"]];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const level = password ? (password.length < 8 ? 0 : Math.max(1, strength(password))) : -1;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    try {
      await register({ name, email, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Save your quizzes and track your progress."
      footer={<>Already registered? <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link></>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Full name" htmlFor="name">
          <input id="name" type="text" autoComplete="name" placeholder="Your name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="email">
          <input id="email" type="email" autoComplete="email" placeholder="you@example.com" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="relative">
            <input
              id="password" type={show ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters"
              className={`${inputCls} pr-11`} value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-soft hover:text-primary">
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {level >= 0 && (
            <div className="mt-1 flex items-center gap-2" aria-live="polite">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <i key={i} className={cx("h-1.5 flex-1 rounded-full transition", i < level ? STRENGTH[level][1] : "bg-line")} />
                ))}
              </div>
              <span className="w-14 text-right text-xs font-semibold text-soft">{STRENGTH[level][0]}</span>
            </div>
          )}
        </Field>
        <Field label="Confirm password" htmlFor="confirm">
          <input id="confirm" type={show ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your password" className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>

        {error && <p role="alert" className="rounded-xl border border-bad/35 bg-bad-bg px-3.5 py-2.5 text-sm text-bad">{error}</p>}

        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />} {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
