import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { VictimLayout } from "@/components/trace/VictimLayout";

export const Route = createFileRoute("/support/")({
  component: ConsentPage,
});

function ConsentPage() {
  const [consent, setConsent] = useState<"named" | "anonymous" | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!consent) return;
    sessionStorage.setItem("trace_consent", consent);
    navigate({ to: "/support/channel" });
  };

  return (
    <VictimLayout>
      <div className="v-stage">
        <div className="v-card">
          <div className="v-title">Before we begin</div>
          <p className="v-lead">
            We'd like to listen to what you're going through so we can connect you with the right
            support. Here's what that means:
          </p>
          <p className="v-lead">
            We'll read or listen to what you share, and gently note signs of distress. A counsellor
            may see this to help you. You can stop at any time.
          </p>

          <div
            className="consent-row"
            role="radiogroup"
            aria-label="Consent choice"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setConsent((prev) => (prev === "named" ? "anonymous" : "named"));
              }
            }}
          >
            <div
              className={`choice-card ${consent === "named" ? "selected" : ""}`}
              onClick={() => setConsent("named")}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setConsent("named");
                }
              }}
              tabIndex={0}
              role="radio"
              aria-checked={consent === "named"}
            >
              <h4>I understand, continue</h4>
              <p>You can still choose to stay anonymous</p>
            </div>

            <div
              className={`choice-card ${consent === "anonymous" ? "selected" : ""}`}
              onClick={() => setConsent("anonymous")}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setConsent("anonymous");
                }
              }}
              tabIndex={0}
              role="radio"
              aria-checked={consent === "anonymous"}
            >
              <h4>I'd rather stay anonymous</h4>
              <p>Continue without sharing your name or contact details</p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-block"
            style={{ background: "var(--v-sys-bubble)", color: "#26362A" }}
            disabled={!consent}
            onClick={handleContinue}
          >
            Continue
          </button>

          {!consent && (
            <p
              style={{
                fontSize: 12,
                color: "var(--v-muted)",
                textAlign: "center",
                margin: "10px 0 0",
              }}
            >
              Select one option above to continue
            </p>
          )}
        </div>
      </div>
    </VictimLayout>
  );
}
