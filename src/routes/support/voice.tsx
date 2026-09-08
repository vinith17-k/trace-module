import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { VictimLayout } from "@/components/trace/VictimLayout";
import { submitInteraction } from "@/lib/trace.functions";

export const Route = createFileRoute("/support/voice")({
  component: VoiceIntakePage,
});

export function VoiceIntakePage() {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState(
    "I've been really scared to go home since the incident. My family keeps getting threats from the neighbours.",
  );
  const [loading, setLoading] = useState(false);

  // Mark active channel so emergency page can return here
  useEffect(() => {
    sessionStorage.setItem("trace_channel", "voice");
    return () => {
      /* keep the channel marker until session ends */
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
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
          channel: "voice",
          languageCode: "en",
          consentGiven: true,
          rawText: transcript,
          audioUrl: "https://example.com/audio/mock-recording.wav",
        },
      });
      sessionStorage.setItem("trace_result", JSON.stringify(result));
      navigate({ to: "/support/confirm" });
    } catch (err) {
      console.error("TRACE voice pipeline error:", err);
      // Fallback for prototype demo
      const fallbackResult = {
        interactionId: "local-voice-" + Math.random().toString(36).substring(2, 9),
        anonymizedRefId: "NHAA-4F82-K91",
        languageCode: "en",
        sviScore: 87,
        riskCategory: "critical",
        traumaIndicators: ["suicidal ideation", "intimidation", "social isolation", "fear"],
        recommendation: {
          id: "rec-voice-" + Date.now(),
          actionType: "police_intervention",
          priority: "immediate",
          assignedAuthority: "Police (Pune Dist.)",
          status: "dispatched",
        },
      };
      sessionStorage.setItem("trace_result", JSON.stringify(fallbackResult));
      navigate({ to: "/support/confirm" });
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
            onClick={() => navigate({ to: "/support/channel" })}
            aria-label="Back to channel selection"
          >
            ← Back
          </button>
          <div className="v-title">Speak whenever you're ready</div>
          <p className="v-lead">There's no rush. Say as much or as little as you'd like.</p>

          {recording ? (
            <div className="voice-visual" id="voiceVisual" style={{ padding: "28px 20px" }}>
              {/* Pulsing Concentric Radar Rings & Animated Waveform */}
              <div
                style={{
                  position: "relative",
                  width: 120,
                  height: 120,
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "2px solid rgba(125, 150, 118, 0.4)",
                    animation: "pulse-radar 2.4s infinite ease-out",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 12,
                    borderRadius: "50%",
                    background: "rgba(195, 211, 190, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div className="wave" style={{ gap: 5 }}>
                    <span style={{ animation: "wave-bar 1.2s infinite ease-in-out", height: 18 }} />
                    <span style={{ animation: "wave-bar 0.9s infinite ease-in-out 0.2s", height: 32 }} />
                    <span style={{ animation: "wave-bar 1.4s infinite ease-in-out 0.4s", height: 44 }} />
                    <span style={{ animation: "wave-bar 1.0s infinite ease-in-out 0.1s", height: 26 }} />
                    <span style={{ animation: "wave-bar 1.3s infinite ease-in-out 0.3s", height: 16 }} />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "0 0 6px" }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#c4593f",
                    animation: "pulse-danger 1.5s infinite",
                  }}
                />
                <span className="font-mono tabular-nums" style={{ fontSize: 18, fontWeight: 800, color: "#2d4431" }}>
                  {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                  {String(seconds % 60).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 12, color: "var(--v-muted)" }}>/ 02:00</span>
              </div>

              <p style={{ fontSize: 13, color: "var(--v-muted)", margin: "0 0 20px" }}>
                Listening carefully in your preferred language…
              </p>

              <div className="voice-controls" style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "var(--v-emergency)",
                    color: "#fff",
                    padding: "9px 18px",
                    fontSize: 13,
                    boxShadow: "0 2px 10px rgba(189,72,44,0.25)",
                  }}
                  onClick={stopRecording}
                >
                  ⏹ Stop & Review
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "transparent",
                    border: "1.5px solid var(--v-border)",
                    color: "var(--v-sys-text)",
                    padding: "9px 16px",
                    fontSize: 13,
                  }}
                  onClick={restartRecording}
                >
                  ↺ Restart
                </button>
              </div>
            </div>
          ) : (
            <div
              id="voiceTranscriptWrap"
              style={{
                textAlign: "left",
                marginTop: 20,
                borderTop: "1px solid var(--v-border)",
                paddingTop: 18,
              }}
            >
              <p style={{ fontSize: 12.5, fontWeight: 700, color: "#5A5343", margin: "0 0 8px" }}>
                Here's what we heard — you can fix anything before continuing:
              </p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 90,
                  fontFamily: "var(--sans)",
                  fontSize: 14,
                  lineHeight: 1.55,
                  border: "1.5px solid var(--v-border)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  color: "#3A342A",
                  background: "var(--v-card)",
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "transparent",
                    border: "1.5px solid var(--v-border)",
                    color: "#5A5343",
                  }}
                  onClick={restartRecording}
                >
                  Record again
                </button>
                <button
                  type="button"
                  className="btn btn-block"
                  style={{ background: "var(--v-sys-bubble)", color: "#26362A", flex: 1 }}
                  onClick={handleContinue}
                  disabled={loading}
                >
                  {loading ? "Evaluating trauma cues..." : "Looks right, continue"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </VictimLayout>
  );
}
