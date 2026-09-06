import React, { useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';

export function PrototypeNavigator() {
  const [isOpen, setIsOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const screens = [
    {
      group: 'Public / Marketing',
      items: [
        { label: '1. Home / Landing', to: '/' },
        { label: '2. About & How it Works', to: '/about' },
        { label: '3. Privacy Policy', to: '/privacy' },
        { label: '4. Terms of Service', to: '/terms' },
        { label: '5. Resources', to: '/resources' },
        { label: '6. Contact / Feedback', to: '/contact' },
      ],
    },
    {
      group: 'Victim-Facing Flow',
      items: [
        { label: '7. Consent Screen', to: '/support' },
        { label: '8. Channel Selection', to: '/support/channel' },
        { label: '9. Chat Intake', to: '/support/chat' },
        { label: '10. Voice Intake', to: '/support/voice' },
        { label: '11. Emergency Overlay', to: '/support/emergency' },
        { label: '12. Confirmation', to: '/support/confirm' },
        { label: '13. Status Check', to: '/support/status' },
      ],
    },
    {
      group: 'Authority / Counsellor Flow',
      items: [
        { label: '14. Staff Login', to: '/staff/login' },
        { label: '15. Case Queue Dashboard', to: '/staff/queue' },
        { label: '16. Case Detail View', to: '/staff/case/NHAA-4F82-K91' },
        { label: '17. My Assigned Cases', to: '/staff/my-cases' },
        { label: '18. Escalation Center', to: '/staff/escalation' },
      ],
    },
    {
      group: 'Police & Law Enforcement',
      items: [
        { label: '19. Police & Witness Protection', to: '/staff/police' },
      ],
    },
    {
      group: 'Admin / Config',
      items: [
        { label: '20. Admin Overview', to: '/admin' },
        { label: '21. SVI Weights Config', to: '/admin/weights' },
        { label: '22. Risk Thresholds Config', to: '/admin/thresholds' },
        { label: '23. Recommendation Rules', to: '/admin/rules' },
        { label: '24. Risk Lexicon Mgmt', to: '/admin/lexicon' },
        { label: '25. User & Role Mgmt', to: '/admin/users' },
        { label: '26. Audit Log Viewer', to: '/admin/audit' },
      ],
    },
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: '#1F2732',
            color: '#fff',
            border: '2px solid #E0A23D',
            borderRadius: 30,
            padding: '8px 14px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
          aria-label="Toggle Prototype Navigator"
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#E0A23D',
              display: 'inline-block',
            }}
          />
          {isOpen ? (
            '✕ Close'
          ) : (
            <>
              <span>⚡</span>
              <span>
                <span className="proto-full-lbl" style={{ display: 'none' }}>Prototype Navigator (26 Screens)</span>
                <span className="proto-short-lbl">Screens (26)</span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10,13,18,0.6)',
            zIndex: 9998,
            display: 'flex',
            justifyContent: 'flex-start',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              width: 320,
              maxWidth: '90vw',
              height: '100vh',
              background: '#12151A',
              color: '#B9C0CC',
              padding: '24px 16px 60px',
              overflowY: 'auto',
              boxShadow: '8px 0 32px rgba(0,0,0,0.5)',
              borderRight: '3px solid #E0A23D',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="proto-flag" style={{ margin: 0 }}>
                Prototype Tooling
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--a-muted)',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '8px 0 2px' }}>
              TRACE Screens
            </h2>
            <p style={{ fontSize: 11.5, color: '#6E7684', margin: '0 0 16px' }}>
              Jump instantly to any screen across all 4 departments
            </p>

            {screens.map((group) => (
              <div key={group.group} className="nav-group">
                <div className="nav-group-label">{group.group}</div>
                {group.items.map((item) => {
                  const isActive =
                    currentPath === item.to ||
                    (item.to !== '/' && currentPath.startsWith(item.to));
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
