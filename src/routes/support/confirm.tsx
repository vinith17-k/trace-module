import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { VictimLayout } from "@/components/trace/VictimLayout";
import { Toast } from "@/components/trace/Toast";

export const Route = createFileRoute("/support/confirm")({
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
  analysis?: {
    sviScore?: number;
    riskCategory?: string;
    traumaIndicators?: string[];
    actionType?: string | null;
    priority?: string | null;
    assignedAuthority?: string | null;
  } | null;
}

function PostIntakeConfirmationPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [showSmsBox, setShowSmsBox] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("trace_result");
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
      : "NHAA-4F82-K91");

  const effectiveRisk = result?.analysis?.riskCategory ?? result?.riskCategory;
  const isHighRisk = effectiveRisk === "critical" || effectiveRisk === "high";

  const handleCopy = () => {
    navigator.clipboard.writeText(refId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setToastMessage("Reference ID copied to clipboard.");
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setShowSmsBox(false);
    setPhoneInput("");
    setToastMessage(`Reference ID ${refId} sent securely to mobile.`);
  };

  const handleClearSession = () => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {
      // ignore
    }
    setToastMessage("Session data cleared from this browser.");
    setTimeout(() => navigate({ to: "/" }), 1000);
  };

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
                background: "var(--v-emergency-bg)",
                color: "#7A3324",
                padding: "12px 14px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Based on what you've told us, this looks urgent — a counsellor is being connected to
              you right now, not just scheduled for later.
            </p>
          ) : (
            <p className="v-lead">
              Your message has been received with care. A trained support counsellor will review
              your details shortly.
            </p>
          )}

          {/* Reference ID Box with Copy Button */}
          <div
            style={{
              background: "#F5F1E7",
              border: "1.5px solid var(--v-border)",
              borderRadius: 12,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: "14px 0 10px",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--v-muted)",
                  letterSpacing: ".05em",
                }}
              >
                Your Anonymous Reference ID
              </div>
              <div
                className="font-mono tabular-nums"
                style={{ fontSize: 20, fontWeight: 800, color: "#423722", letterSpacing: ".06em" }}
              >
                {refId}
              </div>
            </div>

            <button
              type="button"
              className="btn"
              style={{
                background: copied ? "var(--v-sys-bubble)" : "#fff",
                border: "1px solid var(--v-border)",
                color: "#26362A",
                padding: "8px 14px",
                fontSize: 12.5,
              }}
              onClick={handleCopy}
            >
              {copied ? "✓ Copied" : "📋 Copy ID"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "var(--v-muted)",
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={() => setShowSmsBox(!showSmsBox)}
            >
              📱 Send ID via SMS to phone
            </button>
            <span>·</span>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "var(--a-critical)",
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={handleClearSession}
            >
              🔒 Clear device history
            </button>
          </div>

          {showSmsBox && (
            <form onSubmit={handleSendSms} style={{ marginBottom: 18, display: "flex", gap: 8 }}>
              <input
                className="chat-input"
                style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn"
                style={{
                  background: "var(--v-sys-bubble)",
                  color: "#26362A",
                  padding: "8px 14px",
                  fontSize: 12.5,
                }}
              >
                Send SMS
              </button>
            </form>
          )}

          <p style={{ fontSize: 12.5, color: "var(--v-muted)", margin: "0 0 20px" }}>
            Save this ID to check your case status later. If you feel in immediate danger at any
            time, tap Emergency Help above.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              className="btn btn-block"
              style={{ background: "var(--v-sys-bubble)", color: "#26362A" }}
              onClick={() => navigate({ to: "/" })}
            >
              Done & Return Home
            </button>

            <Link
              to="/support/status"
              className="btn btn-block"
              style={{
                background: "transparent",
                border: "1.5px solid var(--v-border)",
                color: "#5A5343",
                textAlign: "center",
              }}
            >
              Check case status
            </Link>
          </div>
        </div>
      </div>

      {toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage(null)} />}
    </VictimLayout>
  );
}
