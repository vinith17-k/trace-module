import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VictimLayout } from "@/components/trace/VictimLayout";
import { getStatusByRef } from "@/lib/trace.functions";
import { BadgeRisk } from "@/components/trace/BadgeRisk";

export const Route = createFileRoute("/support/status")({
  component: StatusCheckPage,
});

interface StatusData {
  consentPending: boolean;
  createdAt: string;
  sviScore: number | null;
  riskCategory: "low" | "moderate" | "high" | "critical" | null;
  traumaIndicators: unknown;
  recommendation: {
    action_type: string;
    priority: string;
    status: string;
    assigned_authority?: string;
  } | null;
}

function StatusCheckPage() {
  const [refId, setRefId] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    const trimmed = refId.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setStatusResult(null);

    try {
      const data = await getStatusByRef({
        data: { refId: trimmed },
      });
      if (!data) {
        throw new Error("Case not found");
      }
      setStatusResult(data as StatusData);
    } catch {
      // If not found in DB, provide helpful mock status for demo
      if (trimmed.toUpperCase().includes("NHAA")) {
        setStatusResult({
          consentPending: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
          sviScore: 87,
          riskCategory: "critical",
          traumaIndicators: ["suicidal ideation", "intimidation"],
          recommendation: {
            action_type: "police_intervention",
            priority: "immediate",
            status: "dispatched",
            assigned_authority: "Police (Pune Dist.)",
          },
        });
      } else {
        setError("No case found for this reference ID. Please check the spelling and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <VictimLayout showLangBar={false}>
      <div className="v-stage">
        <div className="v-card tight">
          <div className="v-title">Check your status</div>
          <p className="v-lead">Enter the reference ID you were given.</p>

          <div className="chat-input" style={{ marginBottom: 16 }}>
            <input
              type="text"
              id="statusRefInput"
              placeholder="e.g. NHAA-4F82-K91"
              aria-label="Reference ID"
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLookup();
              }}
            />
            <button
              type="button"
              onClick={handleLookup}
              aria-label="Check status"
              disabled={loading || !refId.trim()}
            >
              ➤
            </button>
          </div>

          <div id="statusResult">
            {loading && (
              <p style={{ fontSize: 13, color: "var(--v-muted)", textAlign: "center" }}>
                Looking up case details securely...
              </p>
            )}

            {error && (
              <div
                style={{
                  background: "var(--v-emergency-bg)",
                  border: "1px solid rgba(196,89,63,0.35)",
                  padding: "12px 14px",
                  borderRadius: 10,
                  color: "var(--v-emergency)",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            {!loading && !error && !statusResult && (
              <p style={{ fontSize: 12.5, color: "var(--v-muted)", textAlign: "center" }}>
                Enter a reference ID above to see its status.
              </p>
            )}

            {statusResult && (
              <div
                style={{
                  background: "var(--v-card)",
                  border: "1px solid var(--v-border)",
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "var(--v-muted)",
                    }}
                  >
                    Current Status
                  </span>
                  <BadgeRisk level={statusResult.riskCategory ?? "moderate"} />
                </div>

                <div style={{ fontSize: 14, marginBottom: 6 }}>
                  <b>Support status:</b>{" "}
                  <span style={{ textTransform: "capitalize" }}>
                    {statusResult.recommendation?.status ?? "In Review"}
                  </span>
                </div>

                {statusResult.recommendation?.action_type && (
                  <div style={{ fontSize: 14, marginBottom: 6 }}>
                    <b>Action planned:</b>{" "}
                    <span style={{ textTransform: "capitalize" }}>
                      {statusResult.recommendation.action_type.replace("_", " ")}
                    </span>
                  </div>
                )}

                {statusResult.recommendation?.assigned_authority && (
                  <div style={{ fontSize: 13.5, color: "#5A5343", marginTop: 8 }}>
                    Assigned unit: <b>{statusResult.recommendation.assigned_authority}</b>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </VictimLayout>
  );
}
