import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { BadgeRisk } from '@/components/trace/BadgeRisk';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/admin/thresholds')({
  component: RiskThresholdsPage,
});

const THRESHOLDS = [
  { tier: 'critical', min: '80', max: '100' },
  { tier: 'high', min: '60', max: '79' },
  { tier: 'moderate', min: '35', max: '59' },
  { tier: 'low', min: '0', max: '34' },
];

function RiskThresholdsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <h2>Risk Threshold Mapping</h2>
        <button
          type="button"
          className="btn-dash"
          onClick={() => setToastMessage('Thresholds are locked in read-only mode.')}
        >
          Save changes
        </button>
      </div>

      <p className="inline-legend" style={{ margin: '0 0 16px', display: 'inline-block' }}>
        Threshold brackets determine the severity classification triggered by the final computed SVI score.
      </p>

      <table className="config-table">
        <thead>
          <tr>
            <th>Risk category</th>
            <th>Min score</th>
            <th>Max score</th>
          </tr>
        </thead>
        <tbody>
          {THRESHOLDS.map((row) => (
            <tr key={row.tier}>
              <td>
                <BadgeRisk level={row.tier} />
              </td>
              <td>
                <input
                  className="threshold-input"
                  defaultValue={row.min}
                  readOnly
                  style={{ opacity: 0.85 }}
                />
              </td>
              <td>
                <input
                  className="threshold-input"
                  defaultValue={row.max}
                  readOnly
                  style={{ opacity: 0.85 }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
