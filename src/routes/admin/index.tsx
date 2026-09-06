import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { SignalBar } from '@/components/trace/SignalBar';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/admin/')({
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const [timeRange, setTimeRange] = useState('This month');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRangeChange = (val: string) => {
    setTimeRange(val);
    setToastMessage(`Showing: ${val}`);
  };

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <h2>Admin Overview</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            className="search-box"
            style={{ maxWidth: 150 }}
            aria-label="Time range"
            value={timeRange}
            onChange={(e) => handleRangeChange(e.target.value)}
          >
            <option>This month</option>
            <option>Last 30 days</option>
            <option>Last quarter</option>
            <option>Year to date</option>
          </select>
          <span className="auth-role">Admin</span>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <b>1,204</b>
          <span>Total cases this month</span>
        </div>
        <div className="stat-card">
          <b>86</b>
          <span>Critical cases</span>
        </div>
        <div className="stat-card">
          <b>18 min</b>
          <span>Avg. time to first contact</span>
        </div>
        <div className="stat-card">
          <b>97%</b>
          <span>Cases acknowledged &lt;24h</span>
        </div>
      </div>

      <div className="panel">
        <h3>Risk tier distribution (aggregate, no PII)</h3>
        <SignalBar label="Critical" value={14} color="var(--a-critical)" />
        <SignalBar label="High" value={27} color="var(--a-high)" />
        <SignalBar label="Moderate" value={38} color="var(--a-moderate)" />
        <SignalBar label="Low" value={21} color="var(--a-low)" />
        <p className="inline-legend" style={{ marginTop: 12 }}>
          vs. prior period: Critical +2pts, High −1pt, Moderate flat, Low −1pt
        </p>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
