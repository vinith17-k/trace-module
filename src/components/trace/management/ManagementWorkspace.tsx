import React, { useState } from 'react';
import { 
  Network, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  ShieldCheck, 
  Clock, 
  Users, 
  FileText, 
  AlertCircle,
  TrendingUp,
  Download,
  Share2
} from 'lucide-react';
import { PipelineWebChart } from './PipelineWebChart';
import { RoadmapTimeline } from './RoadmapTimeline';
import { CollaborativeNotesFeed } from './CollaborativeNotesFeed';
import { SignalBar } from '@/components/trace/SignalBar';
import { Toast } from '@/components/trace/Toast';

export const ManagementWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'topology' | 'roadmap' | 'feed' | 'metrics'>('topology');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToastMessage(msg);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Topline Header */}
      <div className="auth-topline">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ margin: 0 }}>Inter-Agency Operations Command</h2>
            <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={12} /> Statutory Section 15A Active
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--a-muted)' }}>
            Unified multi-agency coordination portal for Police, District Collectorate, Legal Aid (DLSA), and Judiciary.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            className="btn btn-secondary"
            onClick={() => notify('Exporting statutory compliance dossier (PDF/CSV)...')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <Download size={13} /> Export Report
          </button>
          <span className="auth-role">District Executive Admin</span>
        </div>
      </div>

      {/* KPI Stat Cards Bar */}
      <div className="stat-cards">
        <div className="stat-card">
          <b>1,204</b>
          <span>Total cases managed</span>
        </div>
        <div className="stat-card">
          <b style={{ color: 'var(--a-critical)' }}>86</b>
          <span>Critical tier active</span>
        </div>
        <div className="stat-card">
          <b style={{ color: '#6FA287' }}>18 min</b>
          <span>Avg. QRT first contact</span>
        </div>
        <div className="stat-card">
          <b style={{ color: 'var(--a-accent)' }}>97.4%</b>
          <span>Statutory 48h SLA met</span>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <nav className="workspace-nav" aria-label="Management sections">
        <button 
          className={`workspace-tab ${activeTab === 'topology' ? 'active' : ''}`}
          onClick={() => setActiveTab('topology')}
        >
          <Network size={15} />
          Pipeline Web Chart
          <span className="count">12 Nodes</span>
        </button>

        <button 
          className={`workspace-tab ${activeTab === 'roadmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('roadmap')}
        >
          <Calendar size={15} />
          Notion Roadmap & Timeline
          <span className="count">6 Tracks</span>
        </button>

        <button 
          className={`workspace-tab ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <MessageSquare size={15} />
          Directives & Collaborative Notes
          <span className="count">5 Orders</span>
        </button>

        <button 
          className={`workspace-tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <BarChart3 size={15} />
          Statutory SLAs & Executive Metrics
        </button>
      </nav>

      {/* Tab Panels */}
      <div>
        {activeTab === 'topology' && (
          <PipelineWebChart onNotify={notify} />
        )}

        {activeTab === 'roadmap' && (
          <RoadmapTimeline onNotify={notify} />
        )}

        {activeTab === 'feed' && (
          <CollaborativeNotesFeed onNotify={notify} />
        )}

        {activeTab === 'metrics' && (
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
        )}
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </div>
  );
};
