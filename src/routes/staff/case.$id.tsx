import { createFileRoute, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { BadgeRisk } from '@/components/trace/BadgeRisk';
import { SviRing } from '@/components/trace/SviRing';
import { SignalBar } from '@/components/trace/SignalBar';
import { ConfirmModal } from '@/components/trace/ConfirmModal';
import { Toast } from '@/components/trace/Toast';

export const Route = createFileRoute('/staff/case/$id')({
  component: CaseDetailPage,
});

function CaseDetailPage() {
  const params = useParams({ from: '/staff/case/$id' });
  const caseId = params.id || 'NHAA-4F82-K91';

  const [revealed, setRevealed] = useState(false);
  const [modalState, setModalState] = useState<{
    open: boolean;
    title: string;
    body: string;
    confirmLabel: string;
    confirmClass: string;
    showNote: boolean;
    action: (note?: string) => void;
  }>({
    open: false,
    title: '',
    body: '',
    confirmLabel: 'Confirm',
    confirmClass: 'btn-dash',
    showNote: false,
    action: () => {},
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [auditLog, setAuditLog] = useState([
    { actor: 'System', action: 'SVI computed (87)', time: '12 min ago' },
    { actor: 'System', action: 'Recommendation generated', time: '12 min ago' },
    { actor: 'Priya S.', action: 'Case opened', time: '4 min ago' },
  ]);

  const toggleTranscript = () => {
    if (!revealed) {
      setAuditLog((prev) => [
        { actor: 'Priya S.', action: `Revealed transcript for ${caseId}`, time: 'Just now' },
        ...prev,
      ]);
    }
    setRevealed(!revealed);
  };

  const handleDispatch = () => {
    setModalState({
      open: true,
      title: `Confirm dispatch — ${caseId}`,
      body: 'This will notify Police (Pune Dist.) and initiate witness protection intake for this case. This action is logged and cannot be silently undone.',
      confirmLabel: 'Dispatch now',
      confirmClass: 'btn-danger',
      showNote: true,
      action: (note) => {
        setAuditLog((prev) => [
          {
            actor: 'Priya S.',
            action: `Dispatched Police + Witness protection for ${caseId}${note ? ` — note: ${note}` : ''}`,
            time: 'Just now',
          },
          ...prev,
        ]);
        setToastMessage('Dispatched — Police (Pune Dist.) notified.');
      },
    });
  };

  const handleReassign = () => {
    setModalState({
      open: true,
      title: 'Reassign counsellor',
      body: 'Choose to hand this case to another available counsellor. The current counsellor will be removed from this case.',
      confirmLabel: 'Reassign',
      confirmClass: 'btn-dash',
      showNote: false,
      action: () => {
        setAuditLog((prev) => [
          { actor: 'Priya S.', action: `Reassigned ${caseId} to next available counsellor`, time: 'Just now' },
          ...prev,
        ]);
        setToastMessage('Case reassigned to next available counsellor.');
      },
    });
  };

  return (
    <StaffLayout mode="staff">
      <div className="viewing-as-banner">
        <span className="dot-logged" aria-hidden="true" />
        Viewing as: <b>Priya S. · Counsellor</b> — this access is time-stamped in the audit log below
      </div>

      <div className="auth-topline">
        <h2>
          Case {caseId} <BadgeRisk level="critical" style={{ marginLeft: 8 }} />
        </h2>
        <span className="auth-role">Voice · 12 min ago</span>
      </div>

      <div className="grid-2">
        <div>
          <div className="panel">
            <h3>Trauma indicators</h3>
            <div>
              <span className="tag">suicidal ideation</span>
              <span className="tag">intimidation</span>
              <span className="tag">social isolation</span>
              <span className="tag">fear</span>
            </div>
          </div>

          <div className="panel">
            <h3>Signal breakdown</h3>
            <SignalBar label="Lexical risk keywords" value={88} />
            <SignalBar label="Sentiment (negative)" value={74} />
            <SignalBar label="Acoustic pitch variance" value={65} />
            <SignalBar label="Pause frequency" value={58} />
          </div>

          <div className="panel">
            <h3>Transcript</h3>
            <p
              id="transcriptText"
              className={revealed ? '' : 'transcript-blurred'}
              style={{ fontSize: 13, color: 'var(--a-muted)', lineHeight: 1.6, marginBottom: 14 }}
            >
              "I don't know how much longer I can keep dealing with this... they said they'll come back if I don't withdraw the complaint. I don't feel safe telling anyone."
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-ghost reveal-transcript-btn"
                onClick={toggleTranscript}
              >
                {revealed ? '🔒 Blur transcript' : '👁 Reveal transcript (access will be logged)'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setToastMessage('Audio player placeholder')}
              >
                ▶ Play original audio
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="panel" style={{ textAlign: 'center' }}>
            <h3>Stress Vulnerability Index</h3>
            <div className="svi-ring-wrap" style={{ justifyContent: 'center' }}>
              <SviRing score={87} riskCategory="critical" />
            </div>
            <p className="inline-legend">
              80–100 Critical · 60–79 High · 35–59 Moderate · 0–34 Low
            </p>
          </div>

          <div className="panel">
            <h3>Recommended action</h3>
            <p style={{ fontSize: 13, color: 'var(--a-muted)', margin: '0 0 4px' }}>Priority</p>
            <div style={{ marginBottom: 12 }}>
              <BadgeRisk level="critical" label="Immediate" />
            </div>

            <p style={{ fontSize: 13, color: 'var(--a-muted)', margin: '12px 0 4px' }}>Action type</p>
            <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px' }}>
              Police intervention + Witness protection
            </p>

            <button
              type="button"
              className="btn-danger"
              style={{ width: '100%', marginBottom: 8 }}
              onClick={handleDispatch}
            >
              Dispatch now
            </button>
            <button
              type="button"
              className="btn-ghost"
              style={{ width: '100%' }}
              onClick={handleReassign}
            >
              Reassign counsellor
            </button>
          </div>

          <div className="panel">
            <h3>Audit trail</h3>
            <div id="caseAuditTrail">
              {auditLog.map((entry, idx) => (
                <div key={idx} className="audit-item">
                  <b>{entry.actor}</b> — {entry.action} · {entry.time}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={modalState.open}
        title={modalState.title}
        body={modalState.body}
        confirmLabel={modalState.confirmLabel}
        confirmClass={modalState.confirmClass}
        showNote={modalState.showNote}
        onConfirm={(note) => {
          modalState.action(note);
          setModalState((prev) => ({ ...prev, open: false }));
        }}
        onCancel={() => setModalState((prev) => ({ ...prev, open: false }))}
      />

      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </StaffLayout>
  );
}
