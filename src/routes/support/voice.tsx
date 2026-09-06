import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { VictimLayout } from '@/components/trace/VictimLayout';
import { submitInteraction } from '@/lib/trace.functions';

export const Route = createFileRoute('/support/voice')({
  component: VoiceIntakePage,
});

export function VoiceIntakePage() {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState(
    "I've been really scared to go home since the incident. My family keeps getting threats from the neighbours."
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: any;
    if (recording) {
      timer = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [recording]);

  const stopRecording = () => {
    setRecording(false);
  };

  const restartRecording = () => {
    setSeconds(0);
    setRecording(true);
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const result = await submitInteraction({
        data: {
          channel: 'voice',
          languageCode: 'en',
          consentGiven: true,
          rawText: transcript,
          audioUrl: 'https://example.com/audio/mock-recording.wav',
        },
      });
      sessionStorage.setItem('trace_result', JSON.stringify(result));
      navigate({ to: '/support/confirm' });
    } catch (err) {
      console.error('TRACE voice pipeline error:', err);
      // Fallback for prototype demo
      const fallbackResult = {
        interactionId: 'local-voice-' + Math.random().toString(36).substring(2, 9),
        anonymizedRefId: 'NHAA-4F82-K91',
        languageCode: 'en',
        sviScore: 87,
        riskCategory: 'critical',
        traumaIndicators: ['suicidal ideation', 'intimidation', 'social isolation', 'fear'],
        recommendation: {
          id: 'rec-voice-' + Date.now(),
          actionType: 'police_intervention',
          priority: 'immediate',
          assignedAuthority: 'Police (Pune Dist.)',
          status: 'dispatched',
        },
      };
      sessionStorage.setItem('trace_result', JSON.stringify(fallbackResult));
      navigate({ to: '/support/confirm' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <VictimLayout>
      <div className="v-stage">
        <div className="v-card">
          <button
            type="button"
            className="v-back"
            onClick={() => navigate({ to: '/support/channel' })}
            aria-label="Back to channel selection"
          >
            ← Back
          </button>
          <div className="v-title">
            Speak whenever you're ready
          </div>
          <p className="v-lead">
            There's no rush. Say as much or as little as you'd like.
          </p>

          {recording ? (
            <div className="voice-visual" id="voiceVisual">
              <div className="pulse-ring">
                <div className="wave">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#3E5B41', margin: '0 0 4px', fontVariantNumeric: 'tabular-nums' }}>
                {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')} <span style={{ fontSize: 12, color: 'var(--v-muted)', fontWeight: 400 }}>/ 02:00 max</span>
              </p>
              <p style={{ fontSize: 13, color: 'var(--v-muted)', margin: '0 0 18px' }}>
                Listening to audio signals…
              </p>
              <div className="voice-controls">
                <button type="button" className="round-btn stop" onClick={stopRecording}>
                  Stop recording
                </button>
                <button type="button" className="round-btn" onClick={restartRecording}>
                  Start over
                </button>
              </div>
            </div>
          ) : (
            <div
              id="voiceTranscriptWrap"
              style={{
                textAlign: 'left',
                marginTop: 20,
                borderTop: '1px solid var(--v-border)',
                paddingTop: 18,
              }}
            >
              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#5A5343', margin: '0 0 8px' }}>
                Here's what we heard — you can fix anything before continuing:
              </p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 90,
                  fontFamily: 'var(--sans)',
                  fontSize: 14,
                  lineHeight: 1.55,
                  border: '1.5px solid var(--v-border)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  color: '#3A342A',
                }}
              />
              <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'transparent', border: '1.5px solid var(--v-border)', color: '#5A5343' }}
                  onClick={restartRecording}
                >
                  Record again
                </button>
                <button
                  type="button"
                  className="btn btn-block"
                  style={{ background: 'var(--v-sys-bubble)', color: '#26362A', flex: 1 }}
                  onClick={handleContinue}
                  disabled={loading}
                >
                  {loading ? 'Evaluating trauma cues...' : 'Looks right, continue'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </VictimLayout>
  );
}
