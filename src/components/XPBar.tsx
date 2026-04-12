"use client";

interface Props {
  current: number;
  max: number;
  label?: string;
}

export default function XPBar({ current, max, label }: Props) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className="xpbar">
      <div className="fill" style={{ width: `${pct}%` }} />
      <div className="label">{label ?? `${current} / ${max} XP`}</div>
    </div>
  );
}
