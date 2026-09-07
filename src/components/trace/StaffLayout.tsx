import React, { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  ClipboardList,
  FolderOpen,
  AlertTriangle,
  Shield,
  Settings2,
  SlidersHorizontal,
  Target,
  ListChecks,
  BookOpen,
  Users,
  ScrollText,
  ArrowLeftRight,
  LogIn,
} from 'lucide-react';

interface Props {
  children: ReactNode;
  mode?: 'staff' | 'admin';
  userRole?: string;
  userName?: string;
}

export function StaffLayout({
  children,
  mode = 'staff',
  userRole,
  userName,
}: Props) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const iconProps = { size: 15, style: { verticalAlign: '-3px', marginRight: 4 } as React.CSSProperties };

  const staffNav = [
    { to: '/staff/queue',      label: 'Case Queue',       icon: <ClipboardList {...iconProps} /> },
    { to: '/staff/my-cases',   label: 'My Cases',         icon: <FolderOpen {...iconProps} /> },
    { to: '/staff/escalation', label: 'Escalations',      icon: <AlertTriangle {...iconProps} /> },
    { to: '/staff/police',     label: 'Law Enforcement',  icon: <Shield {...iconProps} /> },
    { to: '/admin',            label: 'Admin',            icon: <Settings2 {...iconProps} /> },
  ];

  const adminNav = [
    { to: '/admin',             label: 'Overview',              icon: <Settings2 {...iconProps} /> },
    { to: '/admin/weights',     label: 'SVI Weights',           icon: <SlidersHorizontal {...iconProps} /> },
    { to: '/admin/thresholds',  label: 'Risk Thresholds',       icon: <Target {...iconProps} /> },
    { to: '/admin/rules',       label: 'Recommendation Rules',  icon: <ListChecks {...iconProps} /> },
    { to: '/admin/lexicon',     label: 'Risk Lexicon',          icon: <BookOpen {...iconProps} /> },
    { to: '/admin/users',       label: 'Users & Roles',         icon: <Users {...iconProps} /> },
    { to: '/admin/audit',       label: 'Audit Log',             icon: <ScrollText {...iconProps} /> },
    { to: '/staff/queue',       label: 'Staff Portal',          icon: <ArrowLeftRight {...iconProps} /> },
  ];

  const items = mode === 'admin' ? adminNav : staffNav;

  // Resolve logged-in user from sessionStorage
  const sessionUser = (() => {
    try {
      const raw = sessionStorage.getItem('trace_staff_user');
      if (raw) return JSON.parse(raw) as { name: string; role: string };
    } catch { /* ignore */ }
    return null;
  })();

  const displayName = userName ?? sessionUser?.name ?? 'Priya S.';
  const displayRole = userRole ?? sessionUser?.role ?? (mode === 'admin' ? 'Admin' : 'Counsellor');

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
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--a-accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, flexShrink: 0,
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--a-muted)', textTransform: 'capitalize' }}>{displayRole}</div>
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
              fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
            }}
          >
            <LogIn size={12} style={{ transform: 'rotate(180deg)' }} /> Out
          </button>
        </div>
      </aside>

      <div className="auth-main">
        {children}
      </div>
    </div>
  );
}
