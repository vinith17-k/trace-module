import React from "react";

interface Props {
  label: string;
  value: number; // 0 - 100
  color?: string;
}

export function SignalBar({ label, value, color = "var(--a-accent)" }: Props) {
  const pct = Math.round(Math.min(100, Math.max(0, value)));
  return (
    <div className="signal-row">
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
      <div className="bar">
        <i style={{ width: `${pct}%`, background: color }} />
      </div>
      <span>{pct}%</span>
    </div>
  );
}
