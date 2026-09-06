import React from 'react';

interface Props {
  score: number;
  riskColor?: string;
  riskCategory?: string;
}

const RISK_COLORS: Record<string, string> = {
  critical: '#E0584F',
  high: '#E0A23D',
  moderate: '#C9AF4A',
  low: '#6FA287',
};

export function SviRing({ score, riskColor, riskCategory }: Props) {
  const color = riskColor ?? (riskCategory ? RISK_COLORS[riskCategory.toLowerCase()] : '#5B8DEF') ?? '#5B8DEF';
  const r = 46;
  const circ = 2 * Math.PI * r; // ~289.02
  const clamped = Math.min(100, Math.max(0, score));
  const offset = circ - (circ * clamped) / 100;

  return (
    <div className="svi-ring">
      <svg width="110" height="110" aria-hidden="true">
        <circle cx="55" cy="55" r={r} stroke="#323D4A" strokeWidth="10" fill="none" />
        <circle
          cx="55"
          cy="55"
          r={r}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '55px 55px' }}
        />
      </svg>
      <div className="svi-num">
        <b>{Math.round(clamped)}</b>
        <span>/ 100</span>
      </div>
    </div>
  );
}
