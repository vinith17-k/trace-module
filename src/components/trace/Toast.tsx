import React, { useEffect, useState } from "react";

interface Props {
  message: string;
  onDone: () => void;
  duration?: number;
}

export function Toast({ message, onDone, duration = 5000 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onDone, 300);
  };

  return (
    <div
      className={`toast ${visible ? "show" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Dismiss notification"
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: "0 2px",
          fontSize: 16,
          lineHeight: 1,
          opacity: 0.7,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
