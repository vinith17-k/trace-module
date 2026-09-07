import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  MessageSquare,
  Network,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { SignalBar } from '@/components/trace/SignalBar';
import { Toast } from '@/components/trace/Toast';

export const ManagementWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'priority' | 'coordination' | 'metrics'>('priority');
  const [queueFilter, setQueueFilter] = useState<'all' | 'critical' | 'sla' | 'unassigned'>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [tasks, setTasks] = useState([
    { id: 'TR-2026-089', title: 'Protection order and Zero FIR follow-up', risk: 'critical', owner: 'DySP K. Meena', agency: 'Police', due: '3 min left', dueMinutes: 3, status: 'Needs action', indicator: 'Intimidation + suicidal ideation' },
    { id: 'TR-2026-074', title: 'Confirm legal aid appointment', risk: 'high', owner: 'Adv. T. Murthy', agency: 'DLSA', due: '42 min left', dueMinutes: 42, status: 'Awaiting agency', indicator: 'Social isolation' },
    { id: 'TR-2026-052', title: 'Charge-sheet review before statutory deadline', risk: 'high', owner: 'DySP S. Rathore', agency: 'Investigation Cell', due: '18 hr left', dueMinutes: 1080, status: 'Needs action', indicator: 'Threats + displacement' },
    { id: 'TR-2026-031', title: 'Court hearing and rehabilitation update', risk: 'moderate', owner: 'Registrar M. Khan', agency: 'Special Court', due: '2 days left', dueMinutes: 2880, status: 'Blocked', indicator: 'Prolonged proceedings' },
    { id: 'TR-2026-018', title: 'Counselling follow-up scheduled', risk: 'low', owner: 'Priya Sharma', agency: 'NHAA Counselling', due: 'Completed today', dueMinutes: 9999, status: 'Resolved', indicator: 'General distress' },
  ]);

  const notify = (msg: string) => {
    setToastMessage(msg);
  };

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (!showResolved && task.status === 'Resolved') return false;
    if (queueFilter === 'critical') return task.risk === 'critical';
    if (queueFilter === 'sla') return task.dueMinutes <= 60;
    if (queueFilter === 'unassigned') return !task.owner;
    return true;
  }), [queueFilter, showResolved, tasks]);

  const updateTask = (id: string, status: string, message: string) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, status } : task));
    notify(message);
  };

  const refresh = () => {
    setLastUpdated('Just now');
    notify('Operations view refreshed using local demo data.');
  };

  const exportQueue = () => {
    const csv = ['Case,Title,Risk,Owner,Agency,Due,Status', ...visibleTasks.map((task) => [task.id, task.title, task.risk, task.owner, task.agency, task.due, task.status].map((value) => `"${value}"`).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'trace-operations-queue.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${visibleTasks.length} visible cases.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="auth-topline">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ margin: 0 }}>Operations overview</h2>
            <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={12} /> Statutory Section 15A Active
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--a-muted)' }}>
            Prioritise urgent victim support, track agency ownership, and resolve statutory deadlines.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="demo-state">Frontend demo data · {lastUpdated}</span>
          <button className="btn btn-secondary" onClick={refresh} title="Refresh operations view" aria-label="Refresh operations view">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-secondary" onClick={exportQueue} title="Export visible queue" aria-label="Export visible queue">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card stat-card-critical">
          <b>2</b>
          <span>Critical cases requiring action</span>
          <button type="button" onClick={() => setQueueFilter('critical')}>Open priority queue <ArrowRight size={13} /></button>
        </div>
        <div className="stat-card">
          <b style={{ color: 'var(--a-high)' }}>3</b>
          <span>Deadlines within one hour</span>
          <button type="button" onClick={() => setQueueFilter('sla')}>Review SLA risk <ArrowRight size={13} /></button>
        </div>
        <div className="stat-card">
          <b style={{ color: 'var(--a-accent)' }}>4</b>
          <span>Agencies with open actions</span>
          <button type="button" onClick={() => setActiveTab('coordination')}>View coordination <ArrowRight size={13} /></button>
        </div>
        <div className="stat-card">
          <b style={{ color: 'var(--a-low)' }}>97.4%</b>
          <span>Statutory SLA met this month</span>
          <button type="button" onClick={() => setActiveTab('metrics')}>View metrics <ArrowRight size={13} /></button>
        </div>
      </div>

      <nav className="workspace-nav" aria-label="Management sections">
        <button className={`workspace-tab ${activeTab === 'priority' ? 'active' : ''}`} onClick={() => setActiveTab('priority')}><AlertCircle size={15} /> Needs attention <span className="count">4 open</span></button>
        <button className={`workspace-tab ${activeTab === 'coordination' ? 'active' : ''}`} onClick={() => setActiveTab('coordination')}><Users size={15} /> Agency coordination <span className="count">4 agencies</span></button>
        <button className={`workspace-tab ${activeTab === 'metrics' ? 'active' : ''}`} onClick={() => setActiveTab('metrics')}><BarChart3 size={15} /> SLA and outcomes</button>
      </nav>

      {activeTab === 'priority' && (
        <div className="management-grid">
          <section className="panel management-queue-panel">
            <div className="section-heading">
              <div><h3>Cases requiring attention</h3><p>Start with the most urgent safe action. All changes are local demo state.</p></div>
              <span className="updated-label"><Clock3 size={13} /> Updated {lastUpdated}</span>
            </div>
            <div className="queue-toolbar">
              <div className="chip-group" aria-label="Case queue filters">
                {(['all', 'critical', 'sla', 'unassigned'] as const).map((filter) => <button key={filter} type="button" className={`chip ${queueFilter === filter ? 'on' : ''}`} onClick={() => setQueueFilter(filter)}>{filter === 'all' ? 'All open' : filter === 'critical' ? 'Critical' : filter === 'sla' ? 'SLA risk' : 'Unassigned'}</button>)}
              </div>
              <label className="checkbox-label"><input type="checkbox" checked={showResolved} onChange={(event) => setShowResolved(event.target.checked)} /> Include resolved</label>
            </div>
            <div className="task-list">
              {visibleTasks.map((task) => <article key={task.id} className={`task-row task-${task.risk}`}>
                <div className="task-priority" aria-label={`${task.risk} risk`}><span className={`node-status-dot ${task.risk === 'critical' ? 'critical' : task.risk === 'high' ? 'warning' : 'optimal'}`} /><span>{task.risk}</span></div>
                <div className="task-main"><div className="task-title-line"><Link to="/staff/case/$id" params={{ id: task.id }}>{task.id}</Link><span className={`badge ${task.status === 'Resolved' ? 'low' : task.status === 'Blocked' ? 'critical' : task.risk}`}>{task.status}</span></div><strong>{task.title}</strong><span className="task-meta">{task.indicator} · {task.agency} · Owner: {task.owner}</span></div>
                <div className={`task-deadline ${task.dueMinutes <= 60 ? 'urgent' : ''}`}><Clock3 size={14} /><span>{task.due}</span></div>
                <div className="task-actions"><button type="button" className="btn btn-secondary btn-compact" onClick={() => navigate({ to: '/staff/case/$id', params: { id: task.id } })}>Open</button>{task.status !== 'Resolved' && <button type="button" className="btn btn-primary btn-compact" onClick={() => updateTask(task.id, 'Acknowledged', `${task.id} acknowledged by District Executive Admin.`)}>Acknowledge</button>}</div>
              </article>)}
              {visibleTasks.length === 0 && <div className="empty-state"><CheckCircle2 className="empty-icon" size={28} /><strong>No cases match this view</strong><span>Try another filter or include resolved cases.</span></div>}
            </div>
          </section>
          <aside className="management-side-column">
            <section className="panel action-panel"><div className="section-heading"><div><h3>Next actions</h3><p>Shortcuts for common management work.</p></div></div><button type="button" className="action-link" onClick={() => updateTask('TR-2026-089', 'Dispatched', 'Protection coordination marked as dispatched.') }><ShieldCheck size={16} /><span><strong>Confirm protection dispatch</strong><small>TR-2026-089 · Police QRT</small></span><ArrowRight size={15} /></button><button type="button" className="action-link" onClick={() => setActiveTab('coordination')}><MessageSquare size={16} /><span><strong>Review agency acknowledgements</strong><small>3 directives need review</small></span><ArrowRight size={15} /></button><button type="button" className="action-link" onClick={exportQueue}><FileText size={16} /><span><strong>Export current queue</strong><small>CSV for operational review</small></span><ArrowRight size={15} /></button></section>
            <section className="panel status-panel"><div className="section-heading"><div><h3>Service status</h3><p>Frontend simulation status</p></div><span className="status-live"><span /> Ready</span></div><div className="service-row"><span><Network size={14} /> Intake and assessment</span><b>Operational</b></div><div className="service-row"><span><ShieldCheck size={14} /> Dispatch workflow</span><b>Needs backend</b></div><div className="service-row"><span><Users size={14} /> Agency coordination</span><b>Operational</b></div></section>
          </aside>
        </div>
      )}

      {activeTab === 'coordination' && (
        <div className="management-grid">
          <section className="panel"><div className="section-heading"><div><h3>Agency coordination</h3><p>Track open work by the team that must act next.</p></div><button type="button" className="btn btn-secondary btn-compact" onClick={() => notify('Coordination list refreshed.') }><RefreshCw size={13} /> Refresh</button></div><div className="agency-list">{[['Police and QRT', '2 critical protections', 'critical'], ['DLSA Legal Aid', '1 appointment awaiting confirmation', 'high'], ['District Collectorate', '1 compensation review', 'high'], ['NHAA Counselling', '4 follow-ups scheduled', 'low']].map(([name, detail, risk]) => <div className="agency-row" key={name}><div className="agency-avatar"><Users size={16} /></div><div><strong>{name}</strong><span>{detail}</span></div><span className={`badge ${risk}`}>{risk === 'critical' ? 'Immediate' : risk === 'high' ? 'Urgent' : 'Routine'}</span><button type="button" className="btn btn-secondary btn-compact" onClick={() => notify(`${name} workspace opened in frontend demo.`)}>Review</button></div>)}</div></section>
          <section className="panel"><div className="section-heading"><div><h3>Coordination principles</h3><p>Use these checks before closing an action.</p></div></div><ul className="principles-list"><li><CheckCircle2 size={15} /> Confirm the responsible agency and named owner.</li><li><CheckCircle2 size={15} /> Record the next deadline and escalation path.</li><li><CheckCircle2 size={15} /> Keep victim identity and transcript access restricted.</li><li><CheckCircle2 size={15} /> Do not mark a notification complete without acknowledgement.</li></ul><button type="button" className="btn btn-primary" onClick={() => notify('Coordination note composer opened in frontend demo.')}> <MessageSquare size={14} /> Add coordination note</button></section>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="management-grid metrics-view">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Risk Tier Panel */}
            <div className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Risk Tier Distribution (Aggregate, Zero-PII)</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--a-muted)' }}>Classified by SVI 14-factor vulnerability matrix</p>
                </div>
                <span className="badge" style={{ fontSize: 11 }}>Live Audit</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SignalBar label="Critical (Armed Escort & Safe Shelter)" value={14} color="var(--a-critical)" />
                <SignalBar label="High (Zero FIR & Sec 15A Mandate)" value={27} color="var(--a-high)" />
                <SignalBar label="Moderate (Legal Aid & Medico-Legal)" value={38} color="var(--a-moderate)" />
                <SignalBar label="Low (Counselling & Monitoring)" value={21} color="var(--a-low)" />
              </div>

              <p className="inline-legend" style={{ marginTop: 16, borderTop: '1px solid var(--a-border)', paddingTop: 12 }}>
                vs. prior 30 days: Critical +2%, High -1%, Moderate flat, Low -1%. Compliant with State Human Rights Commission parameters.
              </p>
            </div>

            {/* Statutory Compliance Milestones */}
            <div className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Statutory Turnaround Compliance (SC/ST POA Act)</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--a-muted)' }}>Mandated deadlines under POA Rules 1995 & 2016 Amendment</p>
                </div>
                <span className="badge badge-low" style={{ fontSize: 11 }}>97.4% Pass</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>Zero FIR Registration (&lt; 2 Hours)</span>
                    <span style={{ color: '#6FA287', fontWeight: 700 }}>99.2% (1,194/1,204)</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '99.2%', background: '#6FA287' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>Interim Compensation Sanction (&lt; 48 Hours)</span>
                    <span style={{ color: '#6FA287', fontWeight: 700 }}>96.5% (1,162/1,204)</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '96.5%', background: '#6FA287' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>Charge-Sheet Filing by DySP (&lt; 60 Days)</span>
                    <span style={{ color: 'var(--a-high)', fontWeight: 700 }}>88.1% (341/387)</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '88.1%', background: 'var(--a-high)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>Day-to-Day Special Court Trial (&lt; 60 Days)</span>
                    <span style={{ color: 'var(--a-critical)', fontWeight: 700 }}>64.3% (92/143)</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '64.3%', background: 'var(--a-critical)' }} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14, background: 'rgba(224,162,61,0.08)', border: '1px solid rgba(224,162,61,0.2)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--a-high)' }}>
                <AlertCircle size={14} />
                Special Court backlog flagged to High Court Registrar General for additional evening sessions.
              </div>
            </div>
          </div>
          <section className="panel"><div className="section-heading"><div><h3>Outcome summary</h3><p>Local demo snapshot for product review.</p></div></div><div className="outcome-list"><div><b>68%</b><span>Critical cases contacted within 15 minutes</span></div><div><b>84%</b><span>High-risk cases with owner assigned</span></div><div><b>92%</b><span>Cases with a recorded next action</span></div></div></section>
        </div>
      )}

      {toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage(null)} />}
    </div>
  );
};
