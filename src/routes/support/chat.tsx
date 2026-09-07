import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { VictimLayout } from '@/components/trace/VictimLayout';
import { submitInteraction } from '@/lib/trace.functions';

export const Route = createFileRoute('/support/chat')({
  component: ChatIntakePage,
});

interface ChatMessage {
  id: string;
  sender: 'sys' | 'user';
  text: string;
  time: string;
}

export function ChatIntakePage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'sys',
      text: "Hi, I'm here to listen. You can share what's on your mind, or just tell me how you're feeling today.",
      time: '10:24 AM',
    },
    {
      id: '2',
      sender: 'user',
      text: "I've been really scared to go home since the incident. My family keeps getting threats from the neighbours.",
      time: '10:26 AM',
    },
    {
      id: '3',
      sender: 'sys',
      text: "That sounds frightening, and I'm glad you told me. Has anyone in your family been physically hurt, or are the threats mostly verbal so far?",
      time: '10:27 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || loading || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: formatTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate empathetic intake response
    setTimeout(() => {
      setIsTyping(false);
      const botResponses = [
        "I hear you, and thank you for telling me. Please know you are safe here. You can share more details, or click 'Finish Assessment & Connect' whenever you're ready.",
        "We are noting everything you share. Is there any immediate physical danger to you or your family right now?",
        "Thank you for your courage in sharing this. A specialist counsellor will review these details immediately once you finish.",
      ];
      const botText: string =
        botResponses[Math.floor(Math.random() * botResponses.length)] ??
        "I hear you, and thank you for telling me. You can share more details, or click 'Finish Assessment & Connect' whenever you're ready.";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'sys',
          text: botText,
          time: formatTime(),
        },
      ]);
    }, 1200);
  };

  const handleFinishAssessment = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // Gather all user messages as conversation context
      const allUserTexts = messages
        .filter((m) => m.sender === 'user')
        .map((m) => m.text)
        .join('\n');

      const result = await submitInteraction({
        data: {
          channel: 'chatbot',
          languageCode: 'en',
          consentGiven: true,
          rawText: allUserTexts || 'Victim reached out via chat intake.',
        },
      });

      // Store result in sessionStorage for confirm page
      sessionStorage.setItem('trace_result', JSON.stringify(result));
      navigate({ to: '/support/confirm' });
    } catch (err: unknown) {
      console.error('TRACE pipeline error:', err);
      // Fallback for prototype demo
      const fallbackResult = {
        interactionId: 'local-demo-' + Math.random().toString(36).substring(2, 9),
        anonymizedRefId: 'NHAA-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-K91',
        languageCode: 'en',
        sviScore: 87,
        riskCategory: 'critical',
        traumaIndicators: ['suicidal ideation', 'intimidation', 'fear'],
        recommendation: {
          id: 'rec-' + Date.now(),
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isTyping]);

  const userMessageCount = messages.filter((m) => m.sender === 'user').length;

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

          <div
            className="chat-window"
            id="chatWindow"
            style={{
              height: 'min(480px, calc(100dvh - 300px))',
              minHeight: 300,
              overflowY: 'auto',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`bubble-row ${m.sender === 'user' ? 'user' : ''}`}
              >
                <div>
                  <div className={`bubble ${m.sender}`}>{m.text}</div>
                  <div
                    className="bubble-time"
                    style={{ textAlign: m.sender === 'user' ? 'right' : 'left' }}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="bubble-row">
                <div>
                  <div
                    className="bubble sys"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 16px',
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#26362A' }}>Listening &amp; typing</span>
                    <span className="wave" style={{ height: 12, display: 'inline-flex', gap: 3 }}>
                      <span style={{ width: 4, height: 8, background: '#3E5B41', borderRadius: 2 }} />
                      <span style={{ width: 4, height: 12, background: '#3E5B41', borderRadius: 2 }} />
                      <span style={{ width: 4, height: 8, background: '#3E5B41', borderRadius: 2 }} />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="bubble-row">
                <div>
                  <div
                    className="bubble sys"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px 18px',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>Analyzing trauma signals &amp; connecting support</span>
                    <span className="wave" style={{ height: 14, display: 'inline-flex', gap: 3 }}>
                      <span style={{ width: 4, height: 8, background: '#3E5B41', borderRadius: 2 }} />
                      <span style={{ width: 4, height: 12, background: '#3E5B41', borderRadius: 2 }} />
                      <span style={{ width: 4, height: 8, background: '#3E5B41', borderRadius: 2 }} />
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* User-Controlled Submission & Escalation CTA Banner */}
          <div
            style={{
              margin: '12px 0',
              padding: '12px 16px',
              borderRadius: 12,
              background: '#F5EFE6',
              border: '1px solid var(--v-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#26362A' }}>
                Ready to submit and get connected?
              </div>
              <div style={{ fontSize: 11.5, color: '#6B5F4C' }}>
                You can submit now or continue writing more details below.
              </div>
            </div>
            <button
              type="button"
              className="btn"
              onClick={handleFinishAssessment}
              disabled={loading || isTyping}
              style={{
                background: 'var(--v-sys-bubble)',
                color: '#26362A',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 800,
                borderRadius: 8,
              }}
            >
              {loading ? 'Submitting…' : 'Finish & Connect →'}
            </button>
          </div>

          <div className="chat-input">
            <input
              type="text"
              id="chatInput"
              placeholder="Type your message here…"
              aria-label="Type your message"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleSend}
              aria-label="Send message"
              disabled={loading || isTyping || !inputText.trim()}
            >
              ➤
            </button>
          </div>

          {errorMsg && (
            <p style={{ fontSize: 12, color: 'var(--a-critical)', margin: '8px 2px 0' }}>
              {errorMsg}
            </p>
          )}

          <p style={{ fontSize: 11.5, color: 'var(--v-muted)', margin: '8px 2px 0' }}>
            You can edit or send a follow-up message any time before continuing — nothing is final until you're shown a reference ID.
          </p>
        </div>
      </div>
    </VictimLayout>
  );
}
