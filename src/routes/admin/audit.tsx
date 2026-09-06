import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';

export const Route = createFileRoute('/admin/audit')({
  component: AuditLogViewerPage,
});

const AUDIT_DATA = [
  { actor: 'Priya S.', action: 'viewed case NHAA-4F82-K91', time: '2 min ago' },
  { actor: 'System', action: 'dispatched notification to Police (Pune) for NHAA-4F82-K91', time: '4 min ago' },
  { actor: 'Admin (R. Iyer)', action: 'updated SVI weight for acoustic pitch variance (0.15 → 0.20)', time: '1 hr ago' },
  { actor: 'Rakesh Y.', action: 'acknowledged case NHAA-3D88-R21', time: '3 hr ago' },
  { actor: 'System', action: 'soft-deleted duplicate record for NHAA-1A02-Z10', time: '1 day ago' },
  { actor: 'Anita D.', action: 'reviewed intake audio recording for NHAA-9A73-L02', time: '2 days ago' },
];

function AuditLogViewerPage() {
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('Last 24 hours');

  const filtered = useMemo(() => {
    if (!search.trim()) return AUDIT_DATA;
    const q = search.toLowerCase();
    return AUDIT_DATA.filter(
      (item) =>
        item.actor.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.time.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <h2>Audit Log Viewer</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            className="search-box"
            style={{ maxWidth: 140 }}
            aria-label="Date range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>All time</option>
          </select>

          <input
            className="search-box"
            id="auditSearch"
            placeholder="Search actor, case, or action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search audit log"
          />
        </div>
      </div>

      <p className="inline-legend" style={{ margin: '0 0 16px', display: 'inline-block' }}>
        Append-only tamper-evident event log recording all case views, triage dispatches, and parameter modifications.
      </p>

      <div id="auditLogList" className="panel">
        {filtered.map((item, idx) => (
          <div key={idx} className="audit-item">
            <b>{item.actor}</b> {item.action} · {item.time}
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--a-muted)', textAlign: 'center', padding: '20px 0' }}>
            No matching audit entries.
          </p>
        )}
      </div>
    </StaffLayout>
  );
}
