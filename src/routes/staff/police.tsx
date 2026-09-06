import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { BadgeRisk } from '@/components/trace/BadgeRisk';

export const Route = createFileRoute('/staff/police')({
  component: LawEnforcementPage,
});

const POLICE_CASES = [
  { refId: 'NHAA-4F82-K91', risk: 'critical', action: 'Witness protection', district: 'Pune', status: 'Assigned' },
  { refId: 'NHAA-3D88-R21', risk: 'high', action: 'Police intervention', district: 'Nagpur', status: 'En route' },
];

function LawEnforcementPage() {
  const navigate = useNavigate();

  return (
    <StaffLayout mode="staff">
      <div className="auth-topline">
        <h2>Flagged for Police / Witness Protection</h2>
        <span className="auth-role">Sub-Inspector · Pune District</span>
      </div>

      <table className="case-table">
        <thead>
          <tr>
            <th>Ref ID</th>
            <th>Risk</th>
            <th>Action needed</th>
            <th>District</th>
            <th>Status</th>
            <th aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {POLICE_CASES.map((c) => (
            <tr
              key={c.refId}
              className="case-row-btn"
              tabIndex={0}
              role="button"
              aria-label={`Open case ${c.refId}`}
              onClick={() => navigate({ to: '/staff/case/$id', params: { id: c.refId } })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate({ to: '/staff/case/$id', params: { id: c.refId } });
                }
              }}
            >
              <td><b>{c.refId}</b></td>
              <td>
                <BadgeRisk level={c.risk} />
              </td>
              <td>{c.action}</td>
              <td>{c.district}</td>
              <td>{c.status}</td>
              <td className="row-chevron" aria-hidden="true">
                ›
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: 12, color: 'var(--a-muted)', marginTop: 16 }}>
        Only cases explicitly flagged for police action are visible here. No unrelated case data or identity details are exposed beyond what's required under the SC/ST Protection Act.
      </p>
    </StaffLayout>
  );
}
