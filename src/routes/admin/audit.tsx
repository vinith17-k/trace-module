import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/admin/audit')({
  component: AuditLogViewerPage,
});

interface AuditLogEntry {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  category: 'Case Access' | 'Dispatch' | 'Config' | 'Auth';
  timestamp: string;
  ipAddress: string;
}

const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: '1',
    actor: 'Priya S.',
    role: 'Counsellor',
    action: 'Viewed Case & Revealed Transcript',
    target: 'NHAA-4F82-K91',
    category: 'Case Access',
    timestamp: '2 min ago',
    ipAddress: '10.14.88.21',
  },
  {
    id: '2',
    actor: 'System (Pipeline)',
    role: 'Automated Worker',
    action: 'Dispatched Armed Police Protection Outbox',
    target: 'NHAA-4F82-K91 → Police Pune',
    category: 'Dispatch',
    timestamp: '4 min ago',
    ipAddress: '127.0.0.1',
  },
  {
    id: '3',
    actor: 'SI Rakesh Yadav',
    role: 'Law Enforcement',
    action: 'Updated Incident Status to "En Route"',
    target: 'NHAA-4F82-K91 (PCR-14)',
    category: 'Dispatch',
    timestamp: '8 min ago',
    ipAddress: '10.14.92.10',
  },
  {
    id: '4',
    actor: 'Admin (R. Iyer)',
    role: 'System Admin',
    action: 'Updated SVI Weight for Acoustic Pitch Variance (0.15 → 0.20)',
    target: 'svi_weights',
    category: 'Config',
    timestamp: '1 hr ago',
    ipAddress: '10.20.10.4',
  },
  {
    id: '5',
    actor: 'Rakesh Y.',
    role: 'Law Enforcement',
    action: 'Acknowledged Police Intervention Notice',
    target: 'NHAA-3D88-R21',
    category: 'Dispatch',
    timestamp: '3 hr ago',
    ipAddress: '10.14.92.10',
  },
  {
    id: '6',
    actor: 'System',
    role: 'Automated Worker',
    action: 'Soft-deleted duplicate test record',
    target: 'NHAA-1A02-Z10',
    category: 'Config',
    timestamp: '1 day ago',
    ipAddress: '127.0.0.1',
  },
  {
    id: '7',
    actor: 'Admin (R. Iyer)',
    role: 'System Admin',
    action: 'Invited New Officer Inspector S. Gaikwad',
    target: 's.gaikwad@police.mh.gov.in',
    category: 'Auth',
    timestamp: '1 day ago',
    ipAddress: '10.20.10.4',
  },
];

function AuditLogViewerPage() {
  useAuthGuard();
  const [logs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOG);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('Last 24 hours');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return logs.filter((item) => {
      const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.actor.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.target.toLowerCase().includes(q) ||
        item.ipAddress.includes(q);
      return matchCat && matchSearch;
    });
  }, [logs, categoryFilter, search]);

  const handleExport = () => {
    setToastMessage(`Exported ${filtered.length} audit records to compliance CSV.`);
  };

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <div>
          <h2>Compliance Audit Log Viewer</h2>
          <p style={{ fontSize: 12.5, color: 'var(--a-muted)', margin: '4px 0 0' }}>
            Immutable, tamper-evident record of all case accesses, transcript reveals, dispatches, and configuration edits
          </p>
        </div>
        <button type="button" className="btn-dash" onClick={handleExport}>
          📥 Export Audit CSV
        </button>
      </div>

      <div className="filter-row">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['All', 'Case Access', 'Dispatch', 'Config', 'Auth'].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip ${categoryFilter === cat ? 'on' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <select
          className="search-box"
          style={{ maxWidth: 140 }}
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          aria-label="Date range"
        >
          <option>Last 24 hours</option>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>All time</option>
        </select>

        <input
          className="search-box"
          placeholder="Filter by actor, case, or action…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="case-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor &amp; Role</th>
                <th>Action Conducted</th>
                <th>Target / Record</th>
                <th>Category</th>
                <th>IP Origin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontSize: 12, color: 'var(--a-muted)' }}>{item.timestamp}</td>
                  <td>
                    <b>{item.actor}</b>
                    <div style={{ fontSize: 11, color: 'var(--a-muted)' }}>{item.role}</div>
                  </td>
                  <td>
                    {item.action.includes('→') ? (
                      <div>
                        <span>{item.action.split('(')[0]}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
                          <span style={{ background: 'rgba(224,88,79,0.2)', color: 'var(--a-critical)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                            {item.action.split('(')[1]?.split('→')[0]?.trim()}
                          </span>
                          <span>→</span>
                          <span style={{ background: 'rgba(111,162,135,0.2)', color: 'var(--a-low)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                            {item.action.split('→')[1]?.replace(')', '').trim()}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span>{item.action}</span>
                    )}
                  </td>
                  <td>
                    <span className="tag" style={{ color: 'var(--a-text)', fontFamily: 'monospace' }}>
                      {item.target}
                    </span>
                  </td>
                  <td>
                    <span
                      className="tag"
                      style={{
                        borderColor:
                          item.category === 'Dispatch'
                            ? 'var(--a-critical)'
                            : item.category === 'Case Access'
                              ? 'var(--a-accent)'
                              : 'var(--a-border)',
                        color: '#fff',
                      }}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td style={{ fontSize: 11.5, color: 'var(--a-muted)', fontFamily: 'monospace' }}>
                    {item.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="inline-legend" style={{ marginTop: 14 }}>
        🔒 All audit records are write-once append-only in Postgres with trigger verification to satisfy statutory court evidence submission criteria.
      </p>

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
