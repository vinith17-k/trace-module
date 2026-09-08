import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { StaffLayout } from "@/components/trace/StaffLayout";
import { BadgeRisk } from "@/components/trace/BadgeRisk";

export const Route = createFileRoute("/staff/queue")({
  component: CaseQueuePage,
});

interface CaseItem {
  id: string;
  refId: string;
  risk: "critical" | "high" | "moderate" | "low";
  score: number;
  indicators: string[];
  channel: string;
  since: string;
  status: string;
  slaMinutesLeft: number;
}

const INITIAL_CASES: CaseItem[] = [
  {
    id: "1",
    refId: "NHAA-4F82-K91",
    risk: "critical",
    score: 87,
    indicators: ["suicidal ideation", "intimidation"],
    channel: "Voice",
    since: "12 min",
    status: "Pending",
    slaMinutesLeft: 3, // 3m left before 15m Critical SLA breach!
  },
  {
    id: "2",
    refId: "NHAA-2C10-B44",
    risk: "high",
    score: 72,
    indicators: ["fear", "isolation"],
    channel: "Chat",
    since: "38 min",
    status: "Dispatched",
    slaMinutesLeft: 82,
  },
  {
    id: "3",
    refId: "NHAA-9A73-L02",
    risk: "moderate",
    score: 48,
    indicators: ["depression"],
    channel: "IVRS",
    since: "1 hr",
    status: "Pending",
    slaMinutesLeft: 140,
  },
  {
    id: "4",
    refId: "NHAA-7E55-Q19",
    risk: "low",
    score: 22,
    indicators: ["general distress"],
    channel: "Webform",
    since: "3 hr",
    status: "Resolved",
    slaMinutesLeft: 999,
  },
];

function CaseQueuePage() {
  useAuthGuard();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "moderate" | "low">("all");
  const [sortBy, setSortBy] = useState<"risk" | "sla" | "time">("risk");
  const [search, setSearch] = useState("");

  const sinceToMinutes = (since: string): number => {
    if (since.includes("hr")) return parseInt(since) * 60;
    return parseInt(since);
  };

  const filteredCases = useMemo(() => {
    const list = INITIAL_CASES.filter((c) => {
      const matchesFilter = filter === "all" || c.risk === filter;
      const matchesSearch =
        !search.trim() ||
        c.refId.toLowerCase().includes(search.toLowerCase()) ||
        c.indicators.some((ind) => ind.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
    });

    return list.sort((a, b) => {
      if (sortBy === "risk") return b.score - a.score;
      if (sortBy === "sla") return a.slaMinutesLeft - b.slaMinutesLeft;
      if (sortBy === "time") return sinceToMinutes(a.since) - sinceToMinutes(b.since);
      return 0;
    });
  }, [filter, sortBy, search]);

  return (
    <StaffLayout mode="staff">
      <div className="auth-topline">
        <h2>Case Queue</h2>
        <span className="auth-role">Counsellor · Priya S.</span>
      </div>

      <div className="filter-row" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", "critical", "high", "moderate", "low"] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              className={`chip ${filter === tier ? "on" : ""}`}
              onClick={() => setFilter(tier)}
            >
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <select
            className="search-box"
            style={{ maxWidth: 180 }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "risk" | "sla" | "time")}
            aria-label="Sort cases"
          >
            <option value="risk">Sort: Severity (High → Low)</option>
            <option value="sla">Sort: Urgent SLA countdown</option>
            <option value="time">Sort: Most recent</option>
          </select>

          <input
            className="search-box"
            id="queueSearch"
            placeholder="Search ref ID or cue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search reference ID"
          />
        </div>
      </div>

      <div className="queue-meta">
        <span id="queueCount">
          Showing {filteredCases.length} of {INITIAL_CASES.length} cases
        </span>
        <span className="sort-indicator">
          Priority Protocol:{" "}
          <b style={{ color: "var(--a-critical)" }}>Critical cases require action &lt; 15 min</b>
        </span>
      </div>

      <div className="table-responsive">
        <table className="case-table">
          <thead>
            <tr>
              <th>Ref ID</th>
              <th>SVI Risk</th>
              <th>SLA Status</th>
              <th>Trauma Indicators</th>
              <th>Channel</th>
              <th>Elapsed</th>
              <th>Action Status</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((c) => (
              <tr
                key={c.id}
                className="case-row-btn"
                tabIndex={0}
                role="button"
                aria-label={`Open case ${c.refId}, ${c.risk} risk, ${c.status}`}
                onClick={() => navigate({ to: "/staff/case/$id", params: { id: c.refId } })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate({ to: "/staff/case/$id", params: { id: c.refId } });
                  }
                }}
              >
                <td>
                  <b className="font-mono tabular-nums" style={{ letterSpacing: "0.03em" }}>
                    {c.refId}
                  </b>
                  <div className="tabular-nums" style={{ fontSize: 11, color: "var(--a-muted)" }}>
                    SVI: <b>{c.score}</b>/100
                  </div>
                </td>
                <td>
                  <BadgeRisk level={c.risk} />
                </td>
                <td>
                  {c.status === "Resolved" ? (
                    <span className="badge-sla-routine" style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>
                      ✓ Resolved
                    </span>
                  ) : c.slaMinutesLeft <= 10 ? (
                    <span
                      className="badge-sla-critical"
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      ⚠️ {c.slaMinutesLeft}m left
                    </span>
                  ) : (
                    <span
                      className="badge-sla-urgent tabular-nums"
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      ⏱ {c.slaMinutesLeft}m left
                    </span>
                  )}
                </td>
                <td>
                  {c.indicators.map((ind) => (
                    <span key={ind} className="tag">
                      {ind}
                    </span>
                  ))}
                </td>
                <td>{c.channel}</td>
                <td>{c.since}</td>
                <td>
                  <span
                    className={`badge ${c.status === "Resolved" ? "low" : c.status === "Dispatched" ? "high" : "moderate"}`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="row-chevron" aria-hidden="true">
                  ›
                </td>
              </tr>
            ))}
            {filteredCases.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>◎</div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--a-text)",
                        marginBottom: 4,
                      }}
                    >
                      No cases match
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--a-muted)" }}>
                      Try a different filter or clear your search.
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </StaffLayout>
  );
}
