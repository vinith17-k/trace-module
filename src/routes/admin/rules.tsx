import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { BadgeRisk } from '@/components/trace/BadgeRisk';
import { ConfirmModal } from '@/components/trace/ConfirmModal';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/admin/rules')({
  component: RecommendationRulesPage,
});

const RULES = [
  { trigger: 'Critical + suicidal ideation', action: 'Emergency support + Police', priority: 'critical', priorityLabel: 'Immediate' },
  { trigger: 'Critical + intimidation', action: 'Witness protection', priority: 'critical', priorityLabel: 'Immediate' },
  { trigger: 'High + isolation', action: 'Counselling + Legal aid', priority: 'high', priorityLabel: 'Urgent' },
  { trigger: 'Moderate + depression', action: 'Counselling', priority: 'moderate', priorityLabel: 'Routine' },
  { trigger: 'Low + general distress', action: 'Self-help resources', priority: 'low', priorityLabel: 'Routine' },
];

function RecommendationRulesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <h2>Recommendation Rules</h2>
        <button
          type="button"
          className="btn-dash"
          onClick={() => setModalOpen(true)}
        >
          + Add rule
        </button>
      </div>

      <p className="inline-legend" style={{ margin: '0 0 16px', display: 'inline-block' }}>
        Automated matching rules link identified trauma cues and severity brackets to immediate dispatch actions.
      </p>

      <table className="case-table">
        <thead>
          <tr>
            <th>Risk + indicator</th>
            <th>Action</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {RULES.map((r, i) => (
            <tr key={i}>
              <td>{r.trigger}</td>
              <td>{r.action}</td>
              <td>
                <BadgeRisk level={r.priority} label={r.priorityLabel} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmModal
        open={modalOpen}
        title="Add recommendation rule"
        body="New rules take effect immediately for all future case scoring and are recorded in the audit log. In the full product this opens a rule builder."
        confirmLabel="Add rule"
        confirmClass="btn-dash"
        onConfirm={() => {
          setModalOpen(false);
          setToastMessage('New recommendation rule added to audit log queue.');
        }}
        onCancel={() => setModalOpen(false)}
      />

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
