import React, { ReactNode, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";

interface Props {
  children: ReactNode;
  showLangBar?: boolean;
  activeLang?: string;
  onSelectLang?: (lang: string) => void;
}

export function VictimLayout({
  children,
  showLangBar = true,
  activeLang = "English",
  onSelectLang,
}: Props) {
  const [currentLang, setCurrentLang] = useState(activeLang);
  const [langToast, setLangToast] = useState<string | null>(null);

  const handleLang = (lang: string) => {
    setCurrentLang(lang);
    if (onSelectLang) onSelectLang(lang);
    if (lang !== "English") {
      setLangToast(`${lang} — मदद जल्द ही उपलब्ध होगी · Support in ${lang} is being added.`);
      setTimeout(() => setLangToast(null), 5000);
    }
  };

  const handleQuickExit = () => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.replace("https://www.google.com");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleQuickExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [fontSizeScale, setFontSizeScale] = useState<"normal" | "large" | "xlarge">("normal");

  return (
    <div
      className={`victim v-stage-ambient ${fontSizeScale === "large" ? "text-lg-scale" : fontSizeScale === "xlarge" ? "text-xl-scale" : ""}`}
      style={{
        minHeight: "100vh",
        position: "relative",
        fontSize: fontSizeScale === "large" ? "1.125rem" : fontSizeScale === "xlarge" ? "1.25rem" : undefined,
      }}
    >
      <div
        className="v-topbar glass-header"
        style={{
          flexWrap: "wrap",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: "1px solid var(--v-border)",
        }}
      >
        {showLangBar ? (
          <div className="v-lang" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {["English", "हिन्दी", "मराठी", "తెలుగు", "தமிழ்"].map((lang) => (
              <button
                key={lang}
                type="button"
                className={`lang-chip ${currentLang === lang ? "active" : ""}`}
                onClick={() => handleLang(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        ) : (
          <Link to="/" className="pub-logo" style={{ fontSize: 18 }}>
            <span className="dot" />
            TRACE
          </Link>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Accessible Font Size Zoom Controls */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(0,0,0,0.04)",
              borderRadius: 20,
              padding: "2px 4px",
              border: "1px solid var(--v-border)",
            }}
            title="Adjust text size for easier reading"
            aria-label="Text Size Controls"
          >
            <button
              type="button"
              onClick={() => setFontSizeScale("normal")}
              style={{
                background: fontSizeScale === "normal" ? "#fff" : "transparent",
                border: "none",
                borderRadius: 14,
                padding: "3px 8px",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                color: "var(--v-sys-text)",
              }}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSizeScale("large")}
              style={{
                background: fontSizeScale === "large" ? "#fff" : "transparent",
                border: "none",
                borderRadius: 14,
                padding: "3px 8px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                color: "var(--v-sys-text)",
              }}
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSizeScale("xlarge")}
              style={{
                background: fontSizeScale === "xlarge" ? "#fff" : "transparent",
                border: "none",
                borderRadius: 14,
                padding: "3px 8px",
                fontSize: 14.5,
                fontWeight: 700,
                cursor: "pointer",
                color: "var(--v-sys-text)",
              }}
            >
              A++
            </button>
          </div>

          <Link to="/support/emergency" className="v-emergency-link">
            Emergency Help (14566)
          </Link>

          <button
            type="button"
            onClick={handleQuickExit}
            style={{
              background: "var(--v-emergency)",
              color: "#fff",
              border: "none",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 12.5,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 8px rgba(189,72,44,0.3)",
            }}
            title="Press Esc or click to leave immediately and clear session"
            aria-keyshortcuts="Escape"
          >
            <span>✕ Quick Exit</span>
            <kbd
              style={{
                fontSize: 10,
                background: "rgba(0,0,0,0.25)",
                padding: "2px 5px",
                borderRadius: 4,
              }}
            >
              Esc
            </kbd>
          </button>
        </div>
      </div>
      {children}

      {/* Language selection feedback toast */}
      {langToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#26362A",
            color: "#E4EDDF",
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            zIndex: 999,
            maxWidth: "90vw",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {langToast}
        </div>
      )}
    </div>
  );
}
