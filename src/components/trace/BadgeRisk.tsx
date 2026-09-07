import React from "react";

export type RiskLevel = "critical" | "high" | "moderate" | "low";

interface Props {
  level: RiskLevel | string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function BadgeRisk({ level, label, className = "", style }: Props) {
  const normLevel = level.toLowerCase();
  const displayLabel = label ?? normLevel.charAt(0).toUpperCase() + normLevel.slice(1);
  return (
    <span className={`badge ${normLevel} ${className}`} style={style}>
      {displayLabel}
    </span>
  );
}
