import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { BadgeRisk } from '@/components/trace/BadgeRisk';

export const Route = createFileRoute('/staff/my-cases')({
  component: MyCasesPage,
});

const MY_CASES = [
  { refId: 'NHAA-4F82-K91', risk: 'critical', lastContact: '4 min ago', status: 'In progress' },
  { refId: 'NHAA-2C10-B44', risk: 'high', lastContact: '1 day ago', status: 'Follow-up scheduled' },
  { refId: 'NHAA-6B21-P77', risk: 'moderate', lastContact: '3 days ago', status: 'Resolved' },
];

function MyCasesPage() {
  useAuthGuard();
  const navigate = useNavigate();

  return (
    <StaffLayout mode="staff">
      <div className="auth-topline">
        <h2>My Assigned Cases</h2>
        <span className="auth-role">Counsellor · Priya S.</span>
      </div>

      <div className="table-responsive">
        <table className="case-table">
          <thead>
            <tr>
              <th>Ref ID</th>
              <th>Risk</th>
              <th>Last contact</th>
              <th>Status</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {MY_CASES.map((c) => (
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
                <td>{c.lastContact}</td>
                <td>{c.status}</td>
                <td className="row-chevron" aria-hidden="true">
                  ›
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StaffLayout>
  );
}
