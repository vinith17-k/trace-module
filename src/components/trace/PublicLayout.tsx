import React, { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';

interface Props {
  children: ReactNode;
}

export function PublicLayout({ children }: Props) {
  return (
    <div className="pub">
      <header className="pub-header">
        <Link to="/" className="pub-logo">
          <span className="dot" />
          TRACE
        </Link>
        <nav className="pub-nav" style={{ flexWrap: 'wrap', gap: 20 }}>
          <a className="tel-link emerg" href="tel:14566" style={{ fontWeight: 800 }}>
            📞 Need help now? Call 14566
          </a>
          <Link to="/about">How it works</Link>
          <Link to="/resources">Resources</Link>
          <Link to="/staff/queue" style={{ color: 'var(--pub-ink)' }}>
            🩺 Counsellor
          </Link>
          <Link to="/staff/police" style={{ color: 'var(--pub-ink)' }}>
            👮 Police Dept
          </Link>
          <Link to="/admin" style={{ color: 'var(--pub-ink)' }}>
            ⚙️ Admin
          </Link>
          <Link to="/support" className="emerg" style={{ fontWeight: 800 }}>
            Get support now
          </Link>
        </nav>
      </header>

      {children}

      <footer className="pub-footer">
        <div className="wrap">
          <div>
            <h4>TRACE</h4>
            <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
              A real-time stress &amp; trauma assessment service under NHAA, Ministry of Social Justice &amp; Empowerment.
            </p>
          </div>
          <div>
            <h4>Quick links</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/resources">Resources</Link>
            <Link to="/staff/login" style={{ marginTop: 8, opacity: 0.7 }}>Staff Portal</Link>
          </div>
          <div className="helplines">
            <h4>Helplines</h4>
            <div>
              <b>NHAA:</b>{' '}
              <a className="tel-link" style={{ color: '#F0C39A' }} href="tel:14566">
                14566
              </a>
            </div>
            <div>
              <b>Police:</b>{' '}
              <a className="tel-link" style={{ color: '#F0C39A' }} href="tel:100">
                100
              </a>
            </div>
            <div>
              <b>Medical:</b>{' '}
              <a className="tel-link" style={{ color: '#F0C39A' }} href="tel:108">
                108
              </a>
            </div>
            <div>
              <b>Women's Helpline:</b>{' '}
              <a className="tel-link" style={{ color: '#F0C39A' }} href="tel:1091">
                1091
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
