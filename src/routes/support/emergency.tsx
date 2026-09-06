import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { VictimLayout } from '@/components/trace/VictimLayout';

export const Route = createFileRoute('/support/emergency')({
  component: EmergencyOverlayPage,
});

function EmergencyOverlayPage() {
  const navigate = useNavigate();

  return (
    <VictimLayout showLangBar={false}>
      <div className="v-stage" style={{ position: 'relative', minHeight: 480 }}>
        {/* Background blurred simulation */}
        <div className="v-card" style={{ filter: 'blur(6px)', opacity: 0.35 }} aria-hidden="true">
          <div className="chat-window">
            <div className="bubble-row">
              <div>
                <div className="bubble sys">I'm really glad you told me. You're not alone in this.</div>
              </div>
            </div>
            <div className="bubble-row user">
              <div>
                <div className="bubble user">I feel in immediate danger right now.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal panel */}
        <div className="overlay-backdrop">
          <div className="emergency-panel">
            <h3>We're here to help right now</h3>
            <p>
              It sounds like you may be in immediate danger or distress. Tap a number below to call immediately — these calls are free.
            </p>
            <div className="helpline-row">
              <span>NHAA Helpline (24/7)</span>
              <a className="tel-link" href="tel:14566">
                14566
              </a>
            </div>
            <div className="helpline-row">
              <span>Police</span>
              <a className="tel-link" href="tel:100">
                100
              </a>
            </div>
            <div className="helpline-row">
              <span>Medical Emergency</span>
              <a className="tel-link" href="tel:108">
                108
              </a>
            </div>
            <div className="helpline-row">
              <span>Women's Helpline</span>
              <a className="tel-link" href="tel:1091">
                1091
              </a>
            </div>

            <a
              className="btn btn-block tel-link"
              style={{
                background: 'var(--v-emergency)',
                color: '#fff',
                marginTop: 16,
                textDecoration: 'none',
              }}
              href="tel:14566"
            >
              📞 Call NHAA now (14566)
            </a>

            <button
              type="button"
              className="btn btn-block"
              style={{
                background: 'transparent',
                border: '1.5px solid var(--v-border)',
                color: '#5A5343',
                marginTop: 10,
              }}
              onClick={() => navigate({ to: '/support/chat' })}
            >
              Keep chatting instead
            </button>
          </div>
        </div>
      </div>
    </VictimLayout>
  );
}
