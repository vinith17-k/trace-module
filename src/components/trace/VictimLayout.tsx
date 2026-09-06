import React, { ReactNode, useState } from 'react';
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

  return (
    <div className="victim" style={{ minHeight: '100vh' }}>
      <div className="v-topbar">
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
        <Link to="/support/emergency" className="v-emergency-link">
          Emergency Help
        </Link>
      </div>
      {children}
    </div>
  );
}
