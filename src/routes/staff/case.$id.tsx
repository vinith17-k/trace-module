import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { StaffLayout } from "@/components/trace/StaffLayout";
import { BadgeRisk } from "@/components/trace/BadgeRisk";
import { SviRing } from "@/components/trace/SviRing";
import { SignalBar } from "@/components/trace/SignalBar";
import { ConfirmModal } from "@/components/trace/ConfirmModal";
import { Toast } from "@/components/trace/Toast";
import { SignalRadarMap } from "@/components/trace/SignalRadarMap";

export const Route = createFileRoute("/staff/case/$id")({
  component: CaseDetailPage,
});

function CaseDetailPage() {
  useAuthGuard();
  const params = useParams({ from: "/staff/case/$id" });
  const caseId = params.id || "NHAA-4F82-K91";

  const [revealed, setRevealed] = useState(false);
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealReason, setRevealReason] = useState("Triage verification");

  // Audio player simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(22); // percent

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isPlaying) {
      timer = setInterval(() => {
        setAudioProgress((p) => (p >= 100 ? 0 : p + 2));
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

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
    title: "",
    body: "",
    confirmLabel: "Confirm",
    confirmClass: "btn-dash",
    showNote: false,
    action: () => {},
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [auditLog, setAuditLog] = useState([
    { actor: "System", action: "SVI computed (87)", time: "12 min ago" },
    { actor: "System", action: "Recommendation generated", time: "12 min ago" },
    { actor: "Priya S.", action: "Case opened", time: "4 min ago" },
  ]);

  const handleRevealClick = () => {
    if (revealed) {
      setRevealed(false);
      setToastMessage("Transcript hidden & re-blurred.");
    } else {
      setRevealModalOpen(true);
    }
  };

  const handleConfirmReveal = () => {
    setAuditLog((prev) => [
      {
        actor: "Priya S.",
        action: `Revealed transcript for ${caseId} (Reason: ${revealReason})`,
        time: "Just now",
      },
      ...prev,
    ]);
    setRevealed(true);
    setRevealModalOpen(false);
    setToastMessage(`Transcript revealed. Access logged with reason: "${revealReason}".`);
  };

  const handleDispatch = () => {
    setModalState({
      open: true,
      title: `Confirm dispatch — ${caseId}`,
      body: "This will notify Police (Pune Dist.) and initiate witness protection intake for this case. This action is logged and cannot be silently undone.",
      confirmLabel: "Dispatch now",
      confirmClass: "btn-danger",
      showNote: true,
      action: (note) => {
        setAuditLog((prev) => [
          {
            actor: "Priya S.",
            action: `Dispatched Police + Witness protection for ${caseId}${note ? ` — note: ${note}` : ""}`,
            time: "Just now",
          },
          ...prev,
        ]);
        setToastMessage("Dispatched — Police (Pune Dist.) notified.");
      },
    });
  };

  const handleReassign = () => {
    setModalState({
      open: true,
      title: "Reassign counsellor",
      body: "Choose to hand this case to another available counsellor. The current counsellor will be removed from this case.",
      confirmLabel: "Reassign",
      confirmClass: "btn-dash",
      showNote: false,
      action: () => {
        setAuditLog((prev) => [
          {
            actor: "Priya S.",
            action: `Reassigned ${caseId} to next available counsellor`,
            time: "Just now",
          },
          ...prev,
        ]);
        setToastMessage("Case reassigned to next available counsellor.");
      },
    });
  };

  return (
    <StaffLayout mode="staff">
      <div className="viewing-as-banner">
        <span className="dot-logged" aria-hidden="true" />
        Viewing as: <b>Priya S. · Counsellor</b> — this access is time-stamped in the audit log
        below
      </div>

      <div className="auth-topline">
        <h2>
          Case <span className="font-mono tabular-nums" style={{ letterSpacing: "0.03em" }}>{caseId}</span>{" "}
          <BadgeRisk level="critical" style={{ marginLeft: 8 }} />
        </h2>
        <span className="auth-role">Voice Intake · 12 min ago</span>
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
            <SignalBar label="Lexical risk keywords" value={88} color="var(--a-critical)" />
            <SignalBar label="Sentiment polarity (negative)" value={74} color="var(--a-high)" />
            <SignalBar label="Acoustic pitch variance" value={65} color="var(--a-high)" />
            <SignalBar label="Pause frequency & silence" value={58} color="var(--a-moderate)" />
          </div>

          {/* Audio Waveform Scrubber Component */}
          <div className="panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>Intake Audio Recording</h3>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--a-muted)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                0:{String(Math.round((audioProgress * 84) / 100)).padStart(2, "0")} / 1:24
              </span>
            </div>

            <div
              style={{
                background: "var(--a-panel2)",
                border: "1px solid var(--a-border)",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    background: isPlaying ? "var(--a-critical)" : "var(--a-accent)",
                    border: "none",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 38,
                    height: 38,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isPlaying ? "❚❚" : "▶"}
                </button>

                {/* Interactive Audio Waveform Bar with Click-to-Seek */}
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                    setAudioProgress(Math.round(pct));
                  }}
                  role="slider"
                  aria-label="Audio playback scrubber"
                  aria-valuenow={Math.round(audioProgress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight") setAudioProgress((p) => Math.min(100, p + 5));
                    if (e.key === "ArrowLeft") setAudioProgress((p) => Math.max(0, p - 5));
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      opacity: 0.35,
                    }}
                  >
                    {[
                      6, 12, 18, 24, 10, 8, 20, 26, 14, 8, 12, 22, 16, 28, 14, 10, 6, 18, 24, 12, 8,
                      14, 20, 10, 6,
                    ].map((h, idx) => (
                      <span
                        key={idx}
                        style={{
                          width: 3,
                          height: `${h}px`,
                          background:
                            idx === 7 || idx === 13 ? "var(--a-critical)" : "var(--a-accent)",
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </div>

                  {/* Scrubber tracker */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      width: `${audioProgress}%`,
                      height: 3,
                      background: "var(--a-accent)",
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: `calc(${audioProgress}% - 10px)`,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#fff",
                      boxShadow: "0 0 8px rgba(0,0,0,0.5)",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 10,
                  fontSize: 11,
                  color: "var(--a-muted)",
                }}
              >
                <span>Start (0:00)</span>
                <button
                  type="button"
                  onClick={() => setAudioProgress(29)}
                  style={{
                    background: "rgba(224,88,79,0.12)",
                    border: "1px solid rgba(224,88,79,0.3)",
                    borderRadius: 4,
                    color: "var(--a-critical)",
                    cursor: "pointer",
                    padding: "2px 6px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  title="Jump to vocal spike at 0:24"
                >
                  ⚠️ 0:24 Vocal Spike
                </button>
                <button
                  type="button"
                  onClick={() => setAudioProgress(52)}
                  style={{
                    background: "rgba(224,88,79,0.12)",
                    border: "1px solid rgba(224,88,79,0.3)",
                    borderRadius: 4,
                    color: "var(--a-critical)",
                    cursor: "pointer",
                    padding: "2px 6px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  title="Jump to stress pause at 0:44"
                >
                  ⚠️ 0:44 Stress Pause
                </button>
                <span>End (1:24)</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <h3>Transcript</h3>
            <p
              id="transcriptText"
              className={revealed ? "" : "transcript-blurred"}
              style={{ fontSize: 13, color: "var(--a-muted)", lineHeight: 1.6, marginBottom: 14 }}
            >
              "I don't know how much longer I can keep dealing with this... they said they'll come
              back if I don't withdraw the complaint. I don't feel safe telling anyone in the
              village."
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn-ghost reveal-transcript-btn"
                onClick={handleRevealClick}
              >
                {revealed
                  ? "🔒 Hide & blur transcript"
                  : "👁 Reveal transcript (requires justification)"}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="panel" style={{ textAlign: "center" }}>
            <h3>Stress Vulnerability Index</h3>
            <div className="svi-ring-wrap" style={{ justifyContent: "center" }}>
              <SviRing score={87} riskCategory="critical" />
            </div>
            <p className="inline-legend">
              80–100 Critical · 60–79 High · 35–59 Moderate · 0–34 Low
            </p>
          </div>

          <div className="panel">
            <h3>Recommended action</h3>
            <p style={{ fontSize: 13, color: "var(--a-muted)", margin: "0 0 4px" }}>Priority</p>
            <div style={{ marginBottom: 12 }}>
              <BadgeRisk level="critical" label="Immediate Dispatch" />
            </div>

            <p style={{ fontSize: 13, color: "var(--a-muted)", margin: "12px 0 4px" }}>
              Action type
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>
              Police intervention + Witness protection safehouse
            </p>

            <button
              type="button"
              className="btn-danger"
              style={{ width: "100%", marginBottom: 8 }}
              onClick={handleDispatch}
            >
              Dispatch now
            </button>
            <button
              type="button"
              className="btn-ghost"
              style={{ width: "100%" }}
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

      {/* Live Geographical Signal Radar & Proximity Triage Map */}
      <div
        className="panel"
        style={{
          marginTop: 24,
          padding: "24px 28px",
          background: "#0a0e14",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 18,
          boxShadow: "0 14px 40px rgba(0,0,0,0.5)",
        }}
      >
        <SignalRadarMap activeCaseId={caseId} isEmbedded />
      </div>

      {/* Mandatory Reason Dialog for Revealing Sensitive Transcript */}
      {revealModalOpen && (
        <div className="confirm-modal-backdrop open" onClick={() => setRevealModalOpen(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Access Control — Reveal Transcript</h3>
            <p style={{ fontSize: 13, color: "var(--a-muted)", margin: "0 0 14px" }}>
              In compliance with the SC/ST Protection of Atrocities Act, viewing victim statements
              requires an explicit justification that is permanently time-stamped in the audit log.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label className="field-label">Reason for access</label>
              <select
                className="field-input"
                value={revealReason}
                onChange={(e) => setRevealReason(e.target.value)}
              >
                <option value="Triage verification">
                  Triage verification &amp; threat confirmation
                </option>
                <option value="Escalation to law enforcement">
                  Escalation to law enforcement &amp; FIR support
                </option>
                <option value="Clinical mental health review">
                  Clinical mental health &amp; trauma counselling
                </option>
                <option value="Court evidence compilation">
                  Special Court evidence verification
                </option>
              </select>
            </div>

            <div className="row">
              <button type="button" className="btn-ghost" onClick={() => setRevealModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-dash" onClick={handleConfirmReveal}>
                Verify &amp; Unblur
              </button>
            </div>
          </div>
        </div>
      )}

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

      {toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage(null)} />}
    </StaffLayout>
  );
}
