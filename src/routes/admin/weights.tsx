import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/admin/weights')({
  component: SviWeightsPage,
});

interface WeightRow {
  key: string;
  signal: string;
  weight: number;
  floor: number;
  description: string;
}

const INITIAL_WEIGHTS: WeightRow[] = [
  { key: 'lexical', signal: 'Lexical risk keywords', weight: 0.30, floor: 0.50, description: 'Direct matches against the statutory trauma lexicon' },
  { key: 'sentiment', signal: 'Sentiment polarity (negative)', weight: 0.20, floor: 0.40, description: 'LLM-derived emotional distress and helplessness signals' },
  { key: 'pitch', signal: 'Acoustic pitch variance', weight: 0.20, floor: 0.50, description: 'Acoustic fundamental frequency variance (F0 perturbation)' },
  { key: 'pause', signal: 'Pause frequency & silence ratio', weight: 0.15, floor: 0.40, description: 'Hesitation, trauma block, and cognitive fatigue pauses' },
  { key: 'speech_rate', signal: 'Speech rate volatility', weight: 0.15, floor: 0.40, description: 'Abnormal tempo deceleration or panic acceleration' },
];

function SviWeightsPage() {
  const [weights, setWeights] = useState<WeightRow[]>(INITIAL_WEIGHTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const total = useMemo(() => {
    return weights.reduce((acc, curr) => acc + curr.weight, 0);
  }, [weights]);

  const isValid = Math.abs(total - 1.0) < 0.001;

  const handleWeightChange = (index: number, val: number) => {
    const updated = [...weights];
    if (updated[index]) {
      updated[index].weight = Number(val.toFixed(2));
      setWeights(updated);
    }
  };

  const handleFloorChange = (index: number, val: number) => {
    const updated = [...weights];
    if (updated[index]) {
      updated[index].floor = Number(val.toFixed(2));
      setWeights(updated);
    }
  };

  const handleReset = () => {
    setWeights(INITIAL_WEIGHTS);
    setToastMessage('Reset weights to system baseline defaults.');
  };

  const handleSave = () => {
    if (!isValid) {
      setToastMessage('Error: Normalized weights must sum to exactly 1.00 before saving.');
      return;
    }
    setToastMessage('SVI weights updated and applied to pipeline scoring.');
  };

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <div>
          <h2>SVI Weights Configuration</h2>
          <p style={{ fontSize: 12.5, color: 'var(--a-muted)', margin: '4px 0 0' }}>
            Tune algorithm parameters for the Stress Vulnerability Index composite formula
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn-ghost" onClick={handleReset}>
            Reset Defaults
          </button>
          <button type="button" className="btn-dash" onClick={handleSave} disabled={!isValid}>
            Save Changes
          </button>
        </div>
      </div>

      <p className="inline-legend" style={{ margin: '0 0 16px', display: 'inline-block' }}>
        SVI Formula: <b style={{ color: 'var(--a-text)' }}>SVI = ∑ (Weight_i × SignalScore_i)</b>. Each signal has a minimum confidence floor below which its contribution is capped to prevent false escalations.
      </p>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="config-table">
          <thead>
            <tr>
              <th>Signal Type</th>
              <th style={{ width: 140 }}>Weight (0.00 - 1.00)</th>
              <th style={{ width: 140 }}>Confidence Floor</th>
              <th>Technical Description</th>
            </tr>
          </thead>
          <tbody>
            {weights.map((row, idx) => (
              <tr key={row.key}>
                <td>
                  <b>{row.signal}</b>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="range"
                      step="0.05"
                      min="0"
                      max="1"
                      style={{ width: 80, accentColor: 'var(--a-accent)' }}
                      value={row.weight}
                      onChange={(e) => handleWeightChange(idx, parseFloat(e.target.value) || 0)}
                    />
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="weight-input"
                      style={{ width: 62 }}
                      value={row.weight}
                      onChange={(e) => handleWeightChange(idx, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={row.floor}
                    onChange={(e) => handleFloorChange(idx, parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td style={{ fontSize: 12, color: 'var(--a-muted)' }}>
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
        <div className={`weights-total ${isValid ? 'ok' : 'bad'}`}>
          Total Weight Sum: {total.toFixed(2)} {isValid ? '✓ (Valid 1.00)' : '⚠️ (Must equal 1.00)'}
        </div>
        {!isValid && (
          <span style={{ fontSize: 12.5, color: 'var(--a-critical)' }}>
            Weights currently sum to {total.toFixed(2)}. Adjust the inputs so the sum is exactly 1.00.
          </span>
        )}
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
