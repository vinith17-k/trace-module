import React, { useEffect, useState } from "react";

interface Props {
  score: number;
  riskColor?: string;
  riskCategory?: string;
}

const RISK_COLORS: Record<string, string> = {
  critical: "#E0584F",
  high: "#E0A23D",
  moderate: "#C9AF4A",
  low: "#6FA287",
};

export function SviRing({ score, riskColor, riskCategory }: Props) {
  const color =
    riskColor ?? (riskCategory ? RISK_COLORS[riskCategory.toLowerCase()] : "#5B8DEF") ?? "#5B8DEF";
  const r = 46;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, score));
  const finalOffset = circ - (circ * clamped) / 100;

  // Animate from fully collapsed (circ) to the final offset
  const [offset, setOffset] = useState(circ);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setTimeout(() => {
        setOffset(finalOffset);
      }, 80);
    });
    // Animate counter
    let frame: number;
    let start: number | null = null;
    const duration = 900;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplayScore(Math.round(progress * clamped));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(frame);
    };
  }, [clamped, finalOffset, circ]);

  const isCritical = (riskCategory?.toLowerCase() === "critical") || clamped >= 80;
  const isHigh = (riskCategory?.toLowerCase() === "high") || (clamped >= 60 && clamped < 80);

  return (
    <div className={`svi-ring ${isCritical ? "risk-glow-critical" : isHigh ? "risk-glow-high" : ""}`} style={{ borderRadius: "50%" }}>
      <svg width="120" height="120" viewBox="0 0 110 110" aria-hidden="true">
        <circle cx="55" cy="55" r={r} stroke="var(--a-border)" strokeWidth="10" fill="none" opacity="0.6" />
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
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "55px 55px",
            transition: "stroke-dashoffset 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)",
            filter: isCritical ? "drop-shadow(0 0 6px rgba(235, 77, 66, 0.6))" : isHigh ? "drop-shadow(0 0 6px rgba(230, 157, 42, 0.5))" : undefined,
          }}
        />
      </svg>
      <div className="svi-num tabular-nums font-mono">
        <b style={{ fontSize: 24, letterSpacing: "-0.02em" }}>{displayScore}</b>
        <span style={{ fontSize: 11, color: "var(--a-muted)" }}>/ 100</span>
      </div>
    </div>
  );
}
