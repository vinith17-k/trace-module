import React, { ReactNode, useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';

interface Props {
  children: ReactNode;
  showLangBar?: boolean;
  activeLang?: string;
  onSelectLang?: (lang: string) => void;
}

export function VictimLayout({
  children,
  showLangBar = true,
  activeLang = 'English',
  onSelectLang,
}: Props) {
  const [currentLang, setCurrentLang] = useState(activeLang);

  const handleLang = (lang: string) => {
    setCurrentLang(lang);
    if (onSelectLang) onSelectLang(lang);
  };

  const handleQuickExit = () => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.replace('https://www.google.com');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleQuickExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="victim" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="v-topbar" style={{ flexWrap: 'wrap', gap: 12 }}>
        {showLangBar ? (
          <div className="v-lang">
            {['English', 'हिन्दी', 'मराठी'].map((lang) => (
              <button
                key={lang}
                type="button"
                className={`lang-chip ${currentLang === lang ? 'active' : ''}`}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/support/emergency" className="v-emergency-link">
            Emergency Help (14566)
          </Link>

          <button
            type="button"
            onClick={handleQuickExit}
            style={{
              background: '#C4593F',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(196,89,63,0.3)',
            }}
            title="Press Esc or click to leave immediately and clear session"
          >
            <span>✕ Quick Exit</span>
            <kbd
              style={{
                fontSize: 10,
                background: 'rgba(0,0,0,0.2)',
                padding: '2px 5px',
                borderRadius: 4,
              }}
            >
              Esc
            </kbd>
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
