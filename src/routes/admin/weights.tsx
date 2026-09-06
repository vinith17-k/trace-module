import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/admin/weights')({
  component: SviWeightsPage,
});

const WEIGHTS_CONFIG = [
  { signal: 'Lexical risk keywords', weight: '0.30', floor: '0.5' },
  { signal: 'Sentiment score', weight: '0.20', floor: '0.4' },
  { signal: 'Acoustic pitch variance', weight: '0.20', floor: '0.5' },
  { signal: 'Pause frequency', weight: '0.15', floor: '0.4' },
  { signal: 'Speech rate', weight: '0.15', floor: '0.4' },
];

function SviWeightsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <h2>SVI Weights Configuration</h2>
        <button
          type="button"
          className="btn-dash"
          onClick={() => setToastMessage('Weights are currently managed in read-only mode via migration.')}
        >
          Save changes
        </button>
      </div>

      <p className="inline-legend" style={{ margin: '0 0 16px', display: 'inline-block' }}>
        Weights define the contribution of each signal type to the 0–100 SVI composite score. Normalized weights sum to 1.00.
      </p>

      <table className="config-table">
        <thead>
          <tr>
            <th>Signal type</th>
            <th>Weight</th>
            <th>Confidence floor</th>
          </tr>
        </thead>
        <tbody>
          {WEIGHTS_CONFIG.map((row) => (
            <tr key={row.signal}>
              <td>{row.signal}</td>
              <td>
                <input
                  className="weight-input"
                  defaultValue={row.weight}
                  readOnly
                  style={{ opacity: 0.85 }}
                />
              </td>
              <td>
                <input
                  defaultValue={row.floor}
                  readOnly
                  style={{ opacity: 0.85 }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 14 }}>
        <div className="weights-total ok">
          Total: 1.00 ✓
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
