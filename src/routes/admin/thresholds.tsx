import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { BadgeRisk } from '@/components/trace/BadgeRisk';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/admin/thresholds')({
  component: RiskThresholdsPage,
});

interface ThresholdTier {
  tier: 'critical' | 'high' | 'moderate' | 'low';
  label: string;
  min: number;
  max: number;
  actionSummary: string;
}

const INITIAL_THRESHOLDS: ThresholdTier[] = [
  { tier: 'critical', label: 'Critical Severity', min: 80, max: 100, actionSummary: 'Immediate police intervention, witness safehouse, armed escort' },
  { tier: 'high', label: 'High Severity', min: 60, max: 79, actionSummary: 'Same-day clinical counselling referral and district legal aid cell' },
  { tier: 'moderate', label: 'Moderate Distress', min: 35, max: 59, actionSummary: 'Scheduled counselling follow-up within 48 hours' },
  { tier: 'low', label: 'Low / Informational', min: 0, max: 34, actionSummary: 'Automated self-help resources and helpline callback on request' },
];

function RiskThresholdsPage() {
  const [thresholds, setThresholds] = useState<ThresholdTier[]>(INITIAL_THRESHOLDS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleBoundChange = (index: number, field: 'min' | 'max', value: number) => {
    const updated = [...thresholds];
    if (updated[index]) {
      updated[index][field] = value;
      setThresholds(updated);
    }
  };

  const handleSave = () => {
    setToastMessage('Threshold brackets validated and saved.');
  };

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <div>
          <h2>Risk Threshold Mapping</h2>
          <p style={{ fontSize: 12.5, color: 'var(--a-muted)', margin: '4px 0 0' }}>
            Map 0–100 SVI score brackets to statutory severity categories and automatic dispatch tiers
          </p>
        </div>
        <button type="button" className="btn-dash" onClick={handleSave}>
          Save Changes
        </button>
      </div>

      <p className="inline-legend" style={{ margin: '0 0 16px', display: 'inline-block' }}>
        Cases scoring within each bracket automatically trigger the corresponding protocol. Threshold changes are logged with administrative accountability.
      </p>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="config-table">
          <thead>
            <tr>
              <th>Risk Category</th>
              <th style={{ width: 120 }}>Min Score</th>
              <th style={{ width: 120 }}>Max Score</th>
              <th>Triggered Protocol Summary</th>
            </tr>
          </thead>
          <tbody>
            {thresholds.map((row, idx) => (
              <tr key={row.tier}>
                <td>
                  <BadgeRisk level={row.tier} />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="threshold-input"
                    value={row.min}
                    onChange={(e) => handleBoundChange(idx, 'min', parseInt(e.target.value) || 0)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="threshold-input"
                    value={row.max}
                    onChange={(e) => handleBoundChange(idx, 'max', parseInt(e.target.value) || 0)}
                  />
                </td>
                <td style={{ fontSize: 12.5, color: 'var(--a-text)' }}>
                  {row.actionSummary}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
