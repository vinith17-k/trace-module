import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { BadgeRisk } from '@/components/trace/BadgeRisk';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/admin/rules')({
  component: RecommendationRulesPage,
});

interface RuleItem {
  id: string;
  trigger: string;
  action: string;
  priority: 'critical' | 'high' | 'moderate' | 'low';
  priorityLabel: string;
  authority: string;
}

const INITIAL_RULES: RuleItem[] = [
  { id: '1', trigger: 'Critical + suicidal ideation', action: 'Emergency Mental Health Crisis Team + Police Escort', priority: 'critical', priorityLabel: 'Immediate', authority: 'District Crisis Team / 108' },
  { id: '2', trigger: 'Critical + intimidation & threats', action: 'Immediate Armed Escort + Safehouse Relocation', priority: 'critical', priorityLabel: 'Immediate', authority: 'State Police / Witness Protection Cell' },
  { id: '3', trigger: 'High + social isolation & boycott', action: 'District Legal Aid Support + Social Justice Officer', priority: 'high', priorityLabel: 'Urgent', authority: 'DLSA / District Administration' },
  { id: '4', trigger: 'Moderate + depression & trauma cues', action: 'Trauma-informed clinical counselling session', priority: 'moderate', priorityLabel: 'Routine', authority: 'NHAA Counselling Network' },
  { id: '5', trigger: 'Low + general stress / inquiry', action: 'Atrocities Act Rights Pamphlet + Self-Help Resources', priority: 'low', priorityLabel: 'Routine', authority: 'NHAA Digital Portal' },
];

function RecommendationRulesPage() {
  const [rules, setRules] = useState<RuleItem[]>(INITIAL_RULES);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [riskTier, setRiskTier] = useState<RuleItem['priority']>('critical');
  const [cue, setCue] = useState('Physical threat / Assault');
  const [actionText, setActionText] = useState('Immediate Police Protection & Medical Aid');
  const [authorityText, setAuthorityText] = useState('Superintendent of Police / Special Court Cell');
  const [priorityTier, setPriorityTier] = useState('Immediate');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: RuleItem = {
      id: Date.now().toString(),
      trigger: `${riskTier.charAt(0).toUpperCase() + riskTier.slice(1)} + ${cue.toLowerCase()}`,
      action: actionText,
      priority: riskTier,
      priorityLabel: priorityTier,
      authority: authorityText,
    };
    setRules([newRule, ...rules]);
    setModalOpen(false);
    setToastMessage(`Added new automated dispatch rule.`);
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
    setToastMessage('Rule removed from dispatch engine.');
  };

  return (
    <StaffLayout mode="admin">
      <div className="auth-topline">
        <div>
          <h2>Recommendation Rules Engine</h2>
          <p style={{ fontSize: 12.5, color: 'var(--a-muted)', margin: '4px 0 0' }}>
            Decision matrix that transforms detected trauma signals and SVI risk into immediate authority dispatches
          </p>
        </div>
        <button
          type="button"
          className="btn-dash"
          onClick={() => setModalOpen(true)}
        >
          + Add Rule
        </button>
      </div>

      <p className="inline-legend" style={{ margin: '0 0 16px', display: 'inline-block' }}>
        The TRACE pipeline matches incoming victim signals against these rules in order of precedence (Critical → High → Moderate → Low).
      </p>

      <div className="panel" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="case-table">
            <thead>
              <tr>
                <th>Risk + Indicator Trigger</th>
                <th>Dispatch Action</th>
                <th>Mandated Authority</th>
                <th>SLA Priority</th>
                <th style={{ width: 80 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b>{r.trigger}</b>
                  </td>
                  <td>{r.action}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--a-muted)' }}>{r.authority}</td>
                  <td>
                    <BadgeRisk level={r.priority} label={r.priorityLabel} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '4px 8px', fontSize: 11, color: 'var(--a-critical)' }}
                      onClick={() => handleDeleteRule(r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="confirm-modal-backdrop open" onClick={() => setModalOpen(false)}>
          <div className="confirm-modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h3>Add New Recommendation Rule</h3>
            <p style={{ fontSize: 13, color: 'var(--a-muted)', margin: '0 0 14px' }}>
              Define condition matching and resulting authority dispatch
            </p>

            <form onSubmit={handleAddRule}>
              <div style={{ marginBottom: 12 }}>
                <label className="field-label">Risk Severity Tier</label>
                <select
                  className="field-input"
                  value={riskTier}
                  onChange={(e) => setRiskTier(e.target.value as RuleItem['priority'])}
                >
                  <option value="critical">Critical (SVI 80–100)</option>
                  <option value="high">High (SVI 60–79)</option>
                  <option value="moderate">Moderate (SVI 35–59)</option>
                  <option value="low">Low (SVI 0–34)</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="field-label">Primary Detected Trauma Cue</label>
                <input
                  className="field-input"
                  value={cue}
                  onChange={(e) => setCue(e.target.value)}
                  placeholder="e.g. Armed threats, Social boycott, Suicidal thoughts"
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="field-label">Mandatory Action</label>
                <input
                  className="field-input"
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  placeholder="e.g. Police protection escort, Safehouse, Legal aid"
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="field-label">Assigned Authority Unit</label>
                <input
                  className="field-input"
                  value={authorityText}
                  onChange={(e) => setAuthorityText(e.target.value)}
                  placeholder="e.g. State Police, DLSA, District Magistrate"
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="field-label">Dispatch SLA Priority</label>
                <select
                  className="field-input"
                  value={priorityTier}
                  onChange={(e) => setPriorityTier(e.target.value)}
                >
                  <option value="Immediate">Immediate (&lt; 15 mins)</option>
                  <option value="Urgent">Urgent (&lt; 2 hrs)</option>
                  <option value="Routine">Routine (&lt; 24 hrs)</option>
                </select>
              </div>

              <div className="row">
                <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-dash">
                  Save &amp; Activate Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
