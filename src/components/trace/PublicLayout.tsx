import React, { ReactNode, useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";

interface Props {
  children: ReactNode;
}

export function PublicLayout({ children }: Props) {
  const [portalOpen, setPortalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPortalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="pub">
      <header className="pub-header">
        <Link to="/" className="pub-logo">
          <span className="dot" />
          TRACE
        </Link>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="pub-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "✕ Close" : "☰ Menu"}
        </button>

        <nav className="pub-nav">
          <a className="tel-link emerg" href="tel:14566" style={{ fontWeight: 800 }}>
            📞 24/7 Helpline: 14566
          </a>
          <Link to="/about">How it works</Link>
          <Link to="/resources">Resources</Link>
          <Link to="/contact">Contact</Link>

          {/* Staff & Authority Dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setPortalOpen(!portalOpen)}
              style={{
                background: "none",
                border: "1px solid #D4CCC0",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--pub-ink)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span>Staff Portals</span>
              <span style={{ fontSize: 10 }}>▾</span>
            </button>

            {portalOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 6,
                  background: "#FFFFFF",
                  border: "1px solid #E8E1D2",
                  borderRadius: 12,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                  minWidth: 200,
                  padding: "8px 6px",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Link
                  to="/staff/login"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--pub-ink)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={() => setPortalOpen(false)}
                >
                  <span>🔐</span> Staff Login
                </Link>
                <Link
                  to="/staff/queue"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--pub-ink)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={() => setPortalOpen(false)}
                >
                  <span>🩺</span> Counsellor Queue
                </Link>
                <Link
                  to="/staff/police"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--pub-ink)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={() => setPortalOpen(false)}
                >
                  <span>👮</span> Police & Escorts
                </Link>
                <div style={{ height: 1, background: "#E8E1D2", margin: "4px 6px" }} />
                <Link
                  to="/admin"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--pub-ink)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={() => setPortalOpen(false)}
                >
                  <span>⚙️</span> Administration
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/support"
            className="btn emerg"
            style={{
              background: "var(--pub-terracotta)",
              color: "#fff",
              padding: "8px 16px",
              fontSize: 13.5,
              fontWeight: 700,
              borderRadius: 8,
            }}
          >
            Get support now
          </Link>
        </nav>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="pub-mobile-drawer" role="dialog" aria-label="Mobile Navigation Menu">
          <a className="tel-link emerg" href="tel:14566" style={{ fontWeight: 800 }}>
            📞 24/7 Helpline: 14566
          </a>
          <Link to="/about" onClick={() => setMobileOpen(false)}>
            How it works
          </Link>
          <Link to="/resources" onClick={() => setMobileOpen(false)}>
            Resources
          </Link>
          <Link to="/contact" onClick={() => setMobileOpen(false)}>
            Contact
          </Link>
          <div style={{ height: 1, background: "#E8E1D2", margin: "4px 0" }} />
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--pub-ink)",
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Staff & Authority Portals
          </div>
          <Link to="/staff/login" onClick={() => setMobileOpen(false)}>
            🔐 Staff Login
          </Link>
          <Link to="/staff/queue" onClick={() => setMobileOpen(false)}>
            🩺 Counsellor Queue
          </Link>
          <Link to="/staff/police" onClick={() => setMobileOpen(false)}>
            👮 Police & Escorts
          </Link>
          <Link to="/admin" onClick={() => setMobileOpen(false)}>
            ⚙️ Administration
          </Link>
          <Link
            to="/support"
            className="btn emerg"
            style={{
              background: "var(--pub-terracotta)",
              color: "#fff",
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 8,
              textAlign: "center",
              justifyContent: "center",
              marginTop: 6,
              textDecoration: "none",
            }}
            onClick={() => setMobileOpen(false)}
          >
            Get support now
          </Link>
        </div>
      )}

      {children}

      <footer className="pub-footer">
        <div className="wrap">
          <div>
            <h4>TRACE</h4>
            <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
              A real-time stress &amp; trauma assessment service under NHAA, Ministry of Social
              Justice &amp; Empowerment.
            </p>
          </div>
          <div>
            <h4>Quick links</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/resources">Resources</Link>
            <Link to="/staff/login" style={{ marginTop: 8, opacity: 0.7 }}>
              Staff Portal
            </Link>
          </div>
          <div className="helplines">
            <h4>Helplines</h4>
            <div>
              <b>NHAA:</b>{" "}
              <a className="tel-link" style={{ color: "#F0C39A" }} href="tel:14566">
                14566
              </a>
            </div>
            <div>
              <b>Police:</b>{" "}
              <a className="tel-link" style={{ color: "#F0C39A" }} href="tel:100">
                100
              </a>
            </div>
            <div>
              <b>Medical:</b>{" "}
              <a className="tel-link" style={{ color: "#F0C39A" }} href="tel:108">
                108
              </a>
            </div>
            <div>
              <b>Women's Helpline:</b>{" "}
              <a className="tel-link" style={{ color: "#F0C39A" }} href="tel:1091">
                1091
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
