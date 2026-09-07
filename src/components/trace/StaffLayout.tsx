import React, { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';

interface Props {
  children: ReactNode;
  mode?: 'staff' | 'admin';
  userRole?: string;
  userName?: string;
}

export function StaffLayout({
  children,
  mode = 'staff',
  userRole: propUserRole,
  userName: propUserName,
}: Props) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  let userName = propUserName;
  let userRole = propUserRole;
  try {
    const rawUser = typeof window !== 'undefined' ? sessionStorage.getItem('trace_staff_user') : null;
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (!userName && parsed.name) userName = parsed.name;
      if (!userRole && parsed.role) userRole = parsed.role;
    }
  } catch {
    // ignore
  }

  const staffNav = [
    {
      to: '/staff/queue',
      label: 'Case Queue',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <rect x="9" y="1" width="6" height="4" rx="1" />
          <line x1="9" y1="10" x2="15" y2="10" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      ),
    },
    {
      to: '/staff/my-cases',
      label: 'My Cases',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <path d="M3 6h6l2 2h10v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z" />
        </svg>
      ),
    },
    {
      to: '/staff/escalation',
      label: 'Escalations',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <path d="M12 3 22 20H2Z" />
          <line x1="12" y1="9" x2="12" y2="14" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      to: '/staff/police',
      label: 'Law Enforcement',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <path d="M12 2 20 5v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5Z" />
        </svg>
      ),
    },
    {
      to: '/admin',
      label: 'Admin',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="3" x2="12" y2="5.5" />
          <line x1="12" y1="18.5" x2="12" y2="21" />
          <line x1="3" y1="12" x2="5.5" y2="12" />
          <line x1="18.5" y1="12" x2="21" y2="12" />
        </svg>
      ),
    },
  ];

  const adminNav = [
    {
      to: '/admin',
      label: 'Overview',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <line x1="5" y1="20" x2="5" y2="12" />
          <line x1="12" y1="20" x2="12" y2="6" />
          <line x1="19" y1="20" x2="19" y2="15" />
          <line x1="3" y1="20" x2="21" y2="20" />
        </svg>
      ),
    },
    {
      to: '/admin/weights',
      label: 'SVI Weights',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <line x1="12" y1="3" x2="12" y2="20" />
          <line x1="5" y1="7" x2="19" y2="7" />
          <circle cx="5" cy="13" r="3" />
          <circle cx="19" cy="13" r="3" />
          <line x1="9" y1="21" x2="15" y2="21" />
        </svg>
      ),
    },
    {
      to: '/admin/thresholds',
      label: 'Risk Thresholds',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
        </svg>
      ),
    },
    {
      to: '/admin/rules',
      label: 'Recommendation Rules',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none" />
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
    {
      to: '/admin/lexicon',
      label: 'Risk Lexicon',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M7 17 5 21 10 17" />
          <line x1="7" y1="9" x2="17" y2="9" />
          <line x1="7" y1="12.5" x2="14" y2="12.5" />
        </svg>
      ),
    },
    {
      to: '/admin/users',
      label: 'Users & Roles',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-5 4-7 8-7s8 2 8 7" />
        </svg>
      ),
    },
    {
      to: '/admin/audit',
      label: 'Audit Log',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <rect x="6" y="2" width="12" height="20" rx="1.5" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <line x1="9" y1="15" x2="13" y2="15" />
        </svg>
      ),
    },
    {
      to: '/staff/queue',
      label: 'Staff Portal',
      icon: (
        <svg className="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: 4 }}>
          <rect x="6" y="3" width="12" height="18" rx="2" />
        </svg>
      ),
    },
  ];

  const items = mode === 'admin' ? adminNav : staffNav;

  return (
    <div className="auth">
      <aside className="auth-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <Link to="/" className="auth-logo" style={{ textDecoration: 'none' }}>
          TRACE
        </Link>
        <nav className="auth-nav">
          {items.map((item, index) => {
            const isActive = currentPath === item.to || (item.to !== '/admin' && item.to !== '/staff/queue' && currentPath.startsWith(item.to));
            const groupLabel = mode === 'admin'
              ? index === 0
                ? 'Operations'
                : index === 1
                  ? 'Configuration'
                  : index === 5
                    ? 'Governance'
                    : index === 7
                      ? 'Switch context'
                      : null
              : null;
            return (
              <React.Fragment key={item.to}>
                {groupLabel && <div className="auth-nav-section-label">{groupLabel}</div>}
                <Link to={item.to} className={isActive ? 'on' : ''}>
                  {item.icon}
                  {item.label}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Logged-in user footer */}
        <div style={{
          marginTop: 'auto',
          paddingTop: 16,
          borderTop: '1px solid var(--a-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--a-accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, flexShrink: 0
            }}>
              {(userName ?? 'P').charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName ?? 'Priya S.'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--a-muted)' }}>{userRole ?? (mode === 'admin' ? 'Admin' : 'Counsellor')}</div>
            </div>
          </div>
          <button
            type="button"
            title="Sign out"
            onClick={() => {
              try { sessionStorage.clear(); } catch { /* ignore */ }
              window.location.href = '/staff/login';
            }}
            style={{
              background: 'none', border: '1px solid var(--a-border)', borderRadius: 8,
              color: 'var(--a-muted)', cursor: 'pointer', padding: '5px 7px',
              fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0
            }}
          >
            ⏻ Out
          </button>
        </div>
      </aside>

      <div className="auth-main">
        {children}
      </div>
    </div>
  );
}
