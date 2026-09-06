import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { VictimLayout } from '@/components/trace/VictimLayout';

export const Route = createFileRoute('/support/channel')({
  component: ChannelSelectPage,
});

function ChannelSelectPage() {
  const navigate = useNavigate();

  return (
    <VictimLayout>
      <div className="v-stage">
        <div className="v-card">
          <button
            type="button"
            className="v-back"
            onClick={() => navigate({ to: '/support' })}
            aria-label="Back to consent screen"
          >
            ← Back
          </button>
          <div className="v-title">How would you like to talk to us?</div>
          <p className="v-lead">Choose whatever feels easiest right now.</p>

          <div className="channel-grid">
            <button
              type="button"
              className="channel-btn"
              onClick={() => navigate({ to: '/support/chat' })}
            >
              <span className="ico" aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 17 6 21 11 17" />
                </svg>
              </span>
              Type a message
            </button>

            <button
              type="button"
              className="channel-btn"
              onClick={() => navigate({ to: '/support/voice' })}
            >
              <span className="ico" aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="2" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="8" y1="22" x2="16" y2="22" />
                </svg>
              </span>
              Speak instead
            </button>
          </div>

          <p style={{ fontSize: 12.5, color: 'var(--v-muted)', textAlign: 'center', margin: 0 }}>
            You can also continue this conversation later through the NHAA IVRS line at{' '}
            <a className="tel-link" href="tel:14566" style={{ color: 'var(--v-muted)' }}>
              14566
            </a>
          </p>
        </div>
      </div>
    </VictimLayout>
  );
}
