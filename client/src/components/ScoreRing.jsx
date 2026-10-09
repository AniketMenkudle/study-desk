export default function ScoreRing({ percent, size = 120 }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const tone = percent >= 70 ? "stroke-good" : percent >= 40 ? "stroke-warn" : "stroke-bad";
  return (
    <svg viewBox="0 0 110 110" width={size} height={size} role="img" aria-label={`${percent} percent`} className="flex-none">
      <circle cx="55" cy="55" r={r} fill="none" strokeWidth="10" className="stroke-primary-soft" />
      <circle
        cx="55" cy="55" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
        className={`${tone} transition-[stroke-dashoffset] duration-1000 ease-out`}
        strokeDasharray={c}
        strokeDashoffset={c - (c * percent) / 100}
        transform="rotate(-90 55 55)"
      />
      <text x="55" y="62" textAnchor="middle" className="fill-ink font-display text-[25px] font-bold">{percent}%</text>
    </svg>
  );
}
