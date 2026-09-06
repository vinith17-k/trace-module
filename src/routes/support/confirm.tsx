import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { VictimLayout } from '@/components/trace/VictimLayout';

export const Route = createFileRoute('/support/confirm')({
  component: PostIntakeConfirmationPage,
});

interface StoredResult {
  anonymizedRefId?: string;
  interactionId?: string;
  sviScore?: number;
  riskCategory?: string;
  traumaIndicators?: string[];
  recommendation?: {
    actionType?: string;
    priority?: string;
    assignedAuthority?: string;
  };
}

function PostIntakeConfirmationPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<StoredResult | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('trace_result');
      if (raw) {
        setResult(JSON.parse(raw));
      }
    } catch {
      // Ignore
    }
  }, []);

  const refId =
    result?.anonymizedRefId ??
    (result?.interactionId
      ? `NHAA-${result.interactionId.slice(0, 4).toUpperCase()}-K91`
      : 'NHAA-4F82-K91');

  const isHighRisk =
    result?.riskCategory === 'critical' || result?.riskCategory === 'high';

  return (
    <VictimLayout showLangBar={false}>
      <div className="v-stage">
        <div className="v-card">
          <div className="confirm-icon" aria-hidden="true">
            ✓
          </div>
          <div className="v-title">Thank you for sharing this with us</div>

          {isHighRisk ? (
            <p
              className="v-lead"
              style={{
                background: 'var(--v-emergency-bg)',
                color: '#7A3324',
                padding: '12px 14px',
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Based on what you've told us, this looks urgent — a counsellor is being connected to you right now, not just scheduled for later.
            </p>
          ) : (
            <p className="v-lead">
              Your message has been received with care. A trained support counsellor will review your details shortly.
            </p>
          )}

          <div className="ref-box">Reference ID: {refId}</div>

          <p style={{ fontSize: 12.5, color: 'var(--v-muted)', margin: '14px 0 20px' }}>
            Save this ID to check your status later, if you'd like. If anything changes or feels unsafe before they reach you, use Emergency Help above at any time.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              className="btn btn-block"
              style={{ background: 'var(--v-sys-bubble)', color: '#26362A' }}
              onClick={() => navigate({ to: '/' })}
            >
              Done
            </button>

            <Link
              to="/support/status"
              className="btn btn-block"
              style={{
                background: 'transparent',
                border: '1.5px solid var(--v-border)',
                color: '#5A5343',
                textAlign: 'center',
              }}
            >
              Check case status
            </Link>
          </div>
        </div>
      </div>
    </VictimLayout>
  );
}
