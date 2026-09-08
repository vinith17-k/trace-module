import React, { useState } from "react";
import {
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Building2,
  Filter,
  Search,
  CheckSquare,
  Square,
  MessageSquare,
  Send,
  X,
  ChevronRight,
  ShieldAlert,
  Edit2,
} from "lucide-react";

export interface MilestoneItem {
  id: string;
  caseRef: string;
  title: string;
  agency: string;
  leadOfficer: string;
  priority: "critical" | "high" | "medium";
  status: "not_started" | "in_progress" | "action_needed" | "completed" | "blocked";
  startPhaseIndex: number; // 0 to 4
  spanPhases: number; // 1 to 5
  progressPct: number; // 0 to 100
  targetDeadline: string;
  checklist: { id: string; text: string; done: boolean }[];
  notes: { id: string; author: string; role: string; time: string; text: string }[];
}

const PHASES = [
  { id: "p1", name: "Phase 1: Ingress & Triage", timeframe: "0 - 2 Hours", color: "#5B8DEF" },
  { id: "p2", name: "Phase 2: Escort & Protection", timeframe: "2 - 12 Hours", color: "#B688F7" },
  { id: "p3", name: "Phase 3: FIR & Med-Legal", timeframe: "12 - 48 Hours", color: "#E0A23D" },
  {
    id: "p4",
    name: "Phase 4: Investigation & Charge-sheet",
    timeframe: "48h - 60 Days",
    color: "#6FA287",
  },
  {
    id: "p5",
    name: "Phase 5: Trial & Rehabilitation",
    timeframe: "60 - 180 Days",
    color: "#3FB950",
  },
];

const INITIAL_MILESTONES: MilestoneItem[] = [
  {
    id: "m-1",
    caseRef: "TR-2026-089",
    title: "Immediate Distress Verification & Witness Escort",
    agency: "State Police QRT",
    leadOfficer: "ACP V. Gaikwad",
    priority: "critical",
    status: "completed",
    startPhaseIndex: 0,
    spanPhases: 2,
    progressPct: 100,
    targetDeadline: "Completed in 45m",
    checklist: [
      { id: "c1", text: "GPS armed patrol dispatched to hamlet perimeter", done: true },
      { id: "c2", text: "Victim & dependents relocated to safe transit house", done: true },
      { id: "c3", text: "Perpetrator vehicle checkpoint alerted", done: true },
    ],
    notes: [
      {
        id: "n1",
        author: "ACP V. Gaikwad",
        role: "Special Police Wing",
        time: "Today 04:15 AM",
        text: "Family moved safely to secure transit location. 2 armed constables posted.",
      },
    ],
  },
  {
    id: "m-2",
    caseRef: "TR-2026-089",
    title: "Zero FIR Registration & Sec 15A Protection Order",
    agency: "Sub-Divisional Magistrate / Police",
    leadOfficer: "DySP K. Meena",
    priority: "critical",
    status: "in_progress",
    startPhaseIndex: 1,
    spanPhases: 2,
    progressPct: 75,
    targetDeadline: "Due in 3 hours",
    checklist: [
      { id: "c4", text: "Sections 3(1)(r)(s) POA Act invoked in Zero FIR", done: true },
      { id: "c5", text: "Independent video recording of victim testimony", done: true },
      { id: "c6", text: "Section 15A witness protection scheme order sealed", done: false },
    ],
    notes: [
      {
        id: "n2",
        author: "DySP K. Meena",
        role: "Investigating Officer",
        time: "Today 08:30 AM",
        text: "Statement taken in presence of female social worker. Video tape archived in evidence locker.",
      },
    ],
  },
  {
    id: "m-3",
    caseRef: "TR-2026-074",
    title: "Forensic Medico-Legal Examination & Injury Corroboration",
    agency: "District Civil Hospital",
    leadOfficer: "Dr. Anita Joshi",
    priority: "high",
    status: "completed",
    startPhaseIndex: 1,
    spanPhases: 1,
    progressPct: 100,
    targetDeadline: "Turnaround: 4.2h",
    checklist: [
      { id: "c7", text: "Comprehensive medical trauma examination", done: true },
      { id: "c8", text: "Forensic swab & toxicological kit submitted to FSL", done: true },
      { id: "c9", text: "Injury report stamped & delivered to IO", done: true },
    ],
    notes: [],
  },
  {
    id: "m-4",
    caseRef: "TR-2026-089",
    title: "Statutory 25% Interim Compensation DBT Clearance",
    agency: "District Collectorate Welfare Cell",
    leadOfficer: "DM K. S. Rao",
    priority: "high",
    status: "action_needed",
    startPhaseIndex: 2,
    spanPhases: 2,
    progressPct: 40,
    targetDeadline: "Statutory SLA: 48h (18h left)",
    checklist: [
      { id: "c10", text: "Aadhaar de-linked escrow account created", done: true },
      { id: "c11", text: "Sanction order signed by District Magistrate", done: false },
      { id: "c12", text: "DBT tranche of ₹2,12,500 credited to beneficiary", done: false },
    ],
    notes: [
      {
        id: "n3",
        author: "DM K. S. Rao",
        role: "District Collector",
        time: "Yesterday 17:00",
        text: "Expedite bank validation. Social Welfare Officer to ensure no bank penalty deduction.",
      },
    ],
  },
  {
    id: "m-5",
    caseRef: "TR-2026-052",
    title: "Statutory 60-Day Investigation & Charge-Sheet Filing",
    agency: "Special Investigation Cell (DySP rank)",
    leadOfficer: "DySP S. Rathore",
    priority: "high",
    status: "in_progress",
    startPhaseIndex: 2,
    spanPhases: 2,
    progressPct: 60,
    targetDeadline: "Day 38 of 60",
    checklist: [
      {
        id: "c13",
        text: "Caste validity certificates seized & verified from Tehsildar",
        done: true,
      },
      { id: "c14", text: "Ballistics & phone tower dump analysis completed", done: true },
      { id: "c15", text: "Final charge-sheet drafted under POA Sec 3 & BNS", done: false },
      { id: "c16", text: "Filing before Special Court prior to 60-day bail limit", done: false },
    ],
    notes: [
      {
        id: "n4",
        author: "DySP S. Rathore",
        role: "Special IO",
        time: "2 days ago",
        text: "FSL ballistic report received. Draft charge-sheet submitted to Special Public Prosecutor for vetting.",
      },
    ],
  },
  {
    id: "m-6",
    caseRef: "TR-2026-031",
    title: "Special Atrocity Court Fast-Track Trial & Final Relief",
    agency: "Designated Special Sessions Court & DLSA",
    leadOfficer: "Registrar M. Khan / Adv. T. Murthy",
    priority: "medium",
    status: "blocked",
    startPhaseIndex: 3,
    spanPhases: 2,
    progressPct: 25,
    targetDeadline: "Trial in Session (Day 74)",
    checklist: [
      { id: "c17", text: "Cognizance taken by Designated Special Judge", done: true },
      { id: "c18", text: "In-camera deposition of protected witnesses", done: false },
      {
        id: "c19",
        text: "Remaining 75% rehabilitation & agricultural land allotment",
        done: false,
      },
      { id: "c20", text: "Final judgment and perpetrator sentencing", done: false },
    ],
    notes: [
      {
        id: "n5",
        author: "Adv. T. Murthy",
        role: "Special Public Prosecutor",
        time: "3 days ago",
        text: "Defense sought adjournment on procedural grounds. Opposed with Rule 4(5) strict day-to-day hearing mandate.",
      },
    ],
  },
];

interface RoadmapTimelineProps {
  onNotify?: (msg: string) => void;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ onNotify }) => {
  const [milestones, setMilestones] = useState<MilestoneItem[]>(INITIAL_MILESTONES);
  const [filterAgency, setFilterAgency] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selected milestone for Notion detail modal
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem | null>(null);
  const [isAddingMilestone, setIsAddingMilestone] = useState<boolean>(false);
  const [newNoteText, setNewNoteText] = useState<string>("");

  // New milestone form state
  const [newMilestone, setNewMilestone] = useState<
    Omit<MilestoneItem, "id" | "checklist" | "notes">
  >({
    caseRef: "TR-2026-091",
    title: "",
    agency: "State Police QRT",
    leadOfficer: "",
    priority: "high",
    status: "in_progress",
    startPhaseIndex: 0,
    spanPhases: 2,
    progressPct: 15,
    targetDeadline: "48h statutory deadline",
  });

  // Filter items
  const filteredMilestones = milestones.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.caseRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.leadOfficer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAgency =
      filterAgency === "all" || m.agency.toLowerCase().includes(filterAgency.toLowerCase());
    const matchesStatus = filterStatus === "all" || m.status === filterStatus;
    return matchesSearch && matchesAgency && matchesStatus;
  });

  // Toggle checklist item
  const handleToggleChecklist = (milestoneId: string, checkId: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id === milestoneId) {
          const updatedChecklist = m.checklist.map((c) =>
            c.id === checkId ? { ...c, done: !c.done } : c,
          );
          const doneCount = updatedChecklist.filter((c) => c.done).length;
          const newPct = Math.round((doneCount / updatedChecklist.length) * 100);
          const updatedMilestone = {
            ...m,
            checklist: updatedChecklist,
            progressPct: newPct,
            status:
              newPct === 100
                ? ("completed" as const)
                : m.status === "not_started"
                  ? ("in_progress" as const)
                  : m.status,
          };
          if (selectedMilestone?.id === milestoneId) {
            setSelectedMilestone(updatedMilestone);
          }
          return updatedMilestone;
        }
        return m;
      }),
    );
    onNotify?.("Updated milestone checklist item");
  };

  // Add note to selected milestone
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedMilestone) return;

    const note = {
      id: "n-" + Date.now(),
      author: "Current User (Admin)",
      role: "District Admin Lead",
      time: "Just now",
      text: newNoteText.trim(),
    };

    const updated = {
      ...selectedMilestone,
      notes: [note, ...selectedMilestone.notes],
    };

    setSelectedMilestone(updated);
    setMilestones((prev) => prev.map((m) => (m.id === selectedMilestone.id ? updated : m)));
    setNewNoteText("");
    onNotify?.("Direct operational note logged on milestone");
  };

  // Update milestone field from modal
  const handleUpdateMilestone = <K extends keyof MilestoneItem>(
    field: K,
    value: MilestoneItem[K],
  ) => {
    if (!selectedMilestone) return;
    const updated = { ...selectedMilestone, [field]: value };
    setSelectedMilestone(updated);
    setMilestones((prev) => prev.map((m) => (m.id === selectedMilestone.id ? updated : m)));
  };

  // Create new milestone
  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.title || !newMilestone.leadOfficer) return;

    const created: MilestoneItem = {
      ...newMilestone,
      id: "m-" + Date.now(),
      checklist: [
        { id: "c1", text: "Initial dispatch verification & authorization", done: true },
        { id: "c2", text: "Inter-agency compliance certificate delivery", done: false },
      ],
      notes: [
        {
          id: "n-init",
          author: "Current User (Admin)",
          role: "District Admin Lead",
          time: "Just now",
          text: "Milestone initialized into statutory tracking timeline.",
        },
      ],
    };

    setMilestones((prev) => [created, ...prev]);
    setIsAddingMilestone(false);
    onNotify?.(`Created statutory milestone: "${created.title}"`);
  };

  const getStatusBadge = (status: MilestoneItem["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span
            className="badge badge-low"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <CheckCircle2 size={11} /> Completed
          </span>
        );
      case "in_progress":
        return (
          <span
            className="badge badge-med"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <Clock size={11} /> In Progress
          </span>
        );
      case "action_needed":
        return (
          <span
            className="badge badge-high"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <AlertCircle size={11} /> Action Needed
          </span>
        );
      case "blocked":
        return (
          <span
            className="badge badge-critical"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <ShieldAlert size={11} /> Blocked
          </span>
        );
      default:
        return (
          <span className="badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            Not Started
          </span>
        );
    }
  };

  const getPriorityColor = (priority: MilestoneItem["priority"]) => {
    switch (priority) {
      case "critical":
        return "var(--a-critical)";
      case "high":
        return "var(--a-high)";
      default:
        return "var(--a-accent)";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Control Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          background: "var(--a-panel)",
          border: "1px solid var(--a-border)",
          borderRadius: 12,
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} color="var(--a-accent)" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              Notion-Style Statutory Case Progression Roadmap
            </span>
            <span
              className="badge"
              style={{
                background: "rgba(91,141,239,0.15)",
                color: "var(--a-accent)",
                borderColor: "rgba(91,141,239,0.3)",
              }}
            >
              {filteredMilestones.length} Active Tracks
            </span>
          </div>

          {/* Search */}
          <div style={{ position: "relative", minWidth: 200 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--a-muted)",
              }}
            />
            <input
              type="text"
              className="search-box"
              placeholder="Search case, milestone or lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 30, height: 34, fontSize: 12.5 }}
            />
          </div>

          {/* Agency Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={14} color="var(--a-muted)" />
            <select
              className="search-box"
              value={filterAgency}
              onChange={(e) => setFilterAgency(e.target.value)}
              style={{ height: 34, fontSize: 12, width: "auto", padding: "0 10px" }}
            >
              <option value="all">All Agencies</option>
              <option value="police">Police & QRT</option>
              <option value="collector">District Collectorate</option>
              <option value="hospital">Civil Hospital</option>
              <option value="court">Special Court & DLSA</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            className="search-box"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ height: 34, fontSize: 12, width: "auto", padding: "0 10px" }}
          >
            <option value="all">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="action_needed">Action Needed</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsAddingMilestone(true)}
          style={{
            padding: "6px 14px",
            fontSize: 12.5,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={14} /> Add Statutory Milestone
        </button>
      </div>

      {/* Notion Board / Gantt Hybrid Layout */}
      <div className="notion-board" style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 1080 }}>
          {/* Header row: Left Item Header + 5 Timeline Phase columns */}
          <div className="notion-timeline-header">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Case Item / Milestone</span>
              <span style={{ fontSize: 10.5, color: "var(--a-muted)" }}>Agency & Lead</span>
            </div>
            {PHASES.map((p) => (
              <div key={p.id}>
                <div style={{ color: p.color, fontWeight: 700, fontSize: 12 }}>{p.name}</div>
                <div style={{ fontSize: 10.5, color: "var(--a-muted)", marginTop: 2 }}>
                  {p.timeframe}
                </div>
              </div>
            ))}
          </div>

          {/* Milestone rows */}
          {filteredMilestones.map((m) => {
            const spanWidthPct = (m.spanPhases / 5) * 100;
            const leftOffsetPct = (m.startPhaseIndex / 5) * 100;

            return (
              <div key={m.id} className="notion-timeline-row">
                {/* Left Column: Meta & Details */}
                <div
                  className="notion-timeline-item-meta"
                  onClick={() => setSelectedMilestone(m)}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: getPriorityColor(m.priority),
                      }}
                    />
                    <span
                      style={{ fontSize: 10.5, fontFamily: "monospace", color: "var(--a-muted)" }}
                    >
                      {m.caseRef}
                    </span>
                    <span style={{ marginLeft: "auto" }}>{getStatusBadge(m.status)}</span>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.title}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: "var(--a-muted)",
                      marginTop: 4,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Building2 size={11} /> {m.agency}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <User size={11} /> {m.leadOfficer}
                    </span>
                  </div>
                </div>

                {/* Right Columns: Gantt Track spanning the 5 columns */}
                <div className="notion-bar-track">
                  {/* Grid background markers for the 5 phase columns */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      gridTemplateColumns: "repeat(5, 1fr)",
                      pointerEvents: "none",
                    }}
                  >
                    {PHASES.map((p, i) => (
                      <div
                        key={p.id}
                        style={{ borderRight: "1px dashed rgba(255,255,255,0.05)", height: "100%" }}
                      />
                    ))}
                  </div>

                  {/* Visual Gantt Bar */}
                  <div
                    className="notion-bar"
                    onClick={() => setSelectedMilestone(m)}
                    style={{
                      position: "relative",
                      left: `${leftOffsetPct}%`,
                      width: `calc(${spanWidthPct}% - 12px)`,
                      background:
                        m.status === "completed"
                          ? "linear-gradient(90deg, #1C382A, #27523C)"
                          : m.status === "blocked"
                            ? "linear-gradient(90deg, #3D1C1B, #542220)"
                            : "linear-gradient(90deg, #1E293B, #273549)",
                      border: `1px solid ${
                        m.status === "completed"
                          ? "rgba(63,185,80,0.5)"
                          : m.status === "blocked"
                            ? "rgba(224,88,79,0.5)"
                            : m.status === "action_needed"
                              ? "rgba(224,162,61,0.5)"
                              : "var(--a-accent)"
                      }`,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}
                    >
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                        }}
                      >
                        {m.title}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <div
                        style={{
                          width: 44,
                          height: 5,
                          background: "rgba(255,255,255,0.15)",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${m.progressPct}%`,
                            height: "100%",
                            background: m.status === "completed" ? "#3FB950" : "var(--a-accent)",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 700 }}>{m.progressPct}%</span>
                      <span style={{ fontSize: 10.5, opacity: 0.75, fontFamily: "monospace" }}>
                        {m.targetDeadline}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMilestones.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--a-muted)" }}>
              No milestones found matching the selected filters.
            </div>
          )}
        </div>
      </div>

      {/* Notion-Style Milestone Detail Drawer / Modal */}
      {selectedMilestone && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--a-panel)",
              border: "1px solid var(--a-border)",
              borderRadius: 14,
              padding: 24,
              width: "100%",
              maxWidth: 680,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid var(--a-border)",
                paddingBottom: 16,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span className="badge" style={{ fontFamily: "monospace" }}>
                    {selectedMilestone.caseRef}
                  </span>
                  <span
                    style={{
                      color: getPriorityColor(selectedMilestone.priority),
                      fontWeight: 700,
                      fontSize: 11.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedMilestone.priority} Priority
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
                  {selectedMilestone.title}
                </h3>
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => setSelectedMilestone(null)}
                style={{ padding: "4px 8px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Notion-style properties grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                rowGap: 14,
                padding: "16px 0",
                borderBottom: "1px solid var(--a-border)",
                fontSize: 13,
              }}
            >
              <span
                style={{ color: "var(--a-muted)", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Clock size={14} /> Status
              </span>
              <div>
                <select
                  className="search-box"
                  value={selectedMilestone.status}
                  onChange={(e) =>
                    handleUpdateMilestone(
                      "status",
                      e.target.value as (typeof selectedMilestone)["status"],
                    )
                  }
                  style={{ height: 32, fontSize: 12, width: "auto" }}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="action_needed">Action Needed</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <span
                style={{ color: "var(--a-muted)", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Building2 size={14} /> Agency
              </span>
              <div>
                <input
                  type="text"
                  className="search-box"
                  value={selectedMilestone.agency}
                  onChange={(e) => handleUpdateMilestone("agency", e.target.value)}
                  style={{ height: 32, fontSize: 12 }}
                />
              </div>

              <span
                style={{ color: "var(--a-muted)", display: "flex", alignItems: "center", gap: 6 }}
              >
                <User size={14} /> Lead Officer
              </span>
              <div>
                <input
                  type="text"
                  className="search-box"
                  value={selectedMilestone.leadOfficer}
                  onChange={(e) => handleUpdateMilestone("leadOfficer", e.target.value)}
                  style={{ height: 32, fontSize: 12 }}
                />
              </div>

              <span
                style={{ color: "var(--a-muted)", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Calendar size={14} /> Timeline Span
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  className="search-box"
                  value={selectedMilestone.startPhaseIndex}
                  onChange={(e) =>
                    handleUpdateMilestone("startPhaseIndex", parseInt(e.target.value))
                  }
                  style={{ height: 32, fontSize: 12 }}
                >
                  {PHASES.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      Start: {p.name}
                    </option>
                  ))}
                </select>
                <span>to</span>
                <select
                  className="search-box"
                  value={selectedMilestone.spanPhases}
                  onChange={(e) => handleUpdateMilestone("spanPhases", parseInt(e.target.value))}
                  style={{ height: 32, fontSize: 12, width: "auto" }}
                >
                  <option value={1}>1 Phase Duration</option>
                  <option value={2}>2 Phases Duration</option>
                  <option value={3}>3 Phases Duration</option>
                  <option value={4}>4 Phases Duration</option>
                  <option value={5}>All 5 Phases</option>
                </select>
              </div>

              <span
                style={{ color: "var(--a-muted)", display: "flex", alignItems: "center", gap: 6 }}
              >
                <CheckSquare size={14} /> Progress
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={selectedMilestone.progressPct}
                  onChange={(e) => handleUpdateMilestone("progressPct", parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: "var(--a-accent)" }}
                />
                <span style={{ fontWeight: 700, minWidth: 40 }}>
                  {selectedMilestone.progressPct}%
                </span>
              </div>
            </div>

            {/* Checklist of Statutory Action Items */}
            <div style={{ padding: "16px 0", borderBottom: "1px solid var(--a-border)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--a-muted)",
                  }}
                >
                  Statutory Checklist & Verifications (
                  {selectedMilestone.checklist.filter((c) => c.done).length}/
                  {selectedMilestone.checklist.length})
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedMilestone.checklist.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleToggleChecklist(selectedMilestone.id, c.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      padding: "8px 12px",
                      background: c.done ? "rgba(63,185,80,0.08)" : "var(--a-panel2)",
                      border: "1px solid var(--a-border)",
                      borderRadius: 8,
                      transition: "background 0.15s ease",
                    }}
                  >
                    {c.done ? (
                      <CheckSquare size={16} color="#3FB950" />
                    ) : (
                      <Square size={16} color="var(--a-muted)" />
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        color: c.done ? "var(--a-muted)" : "var(--a-text)",
                        textDecoration: c.done ? "line-through" : "none",
                      }}
                    >
                      {c.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Directives & Comments Thread */}
            <div style={{ padding: "16px 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--a-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MessageSquare size={14} color="var(--a-accent)" />
                  Cross-Departmental Directives & Notes ({selectedMilestone.notes.length})
                </span>
              </div>

              {/* Note input */}
              <form onSubmit={handleAddNote} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input
                  type="text"
                  className="search-box"
                  placeholder="Record an operational update or inter-agency instruction..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  style={{ height: 36, fontSize: 12.5 }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newNoteText.trim()}
                  style={{ padding: "0 14px", height: 36 }}
                >
                  <Send size={13} />
                </button>
              </form>

              {/* Notes list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  maxHeight: 180,
                  overflowY: "auto",
                }}
              >
                {selectedMilestone.notes.length === 0 ? (
                  <div
                    style={{
                      color: "var(--a-muted)",
                      fontSize: 12,
                      textAlign: "center",
                      padding: "12px 0",
                    }}
                  >
                    No notes recorded on this milestone yet.
                  </div>
                ) : (
                  selectedMilestone.notes.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        background: "var(--a-panel2)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 8,
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                            {n.author}
                          </span>
                          <span className="badge" style={{ fontSize: 9.5 }}>
                            {n.role}
                          </span>
                        </div>
                        <span style={{ fontSize: 10.5, color: "var(--a-muted)" }}>{n.time}</span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12.5,
                          color: "var(--a-text)",
                          lineHeight: 1.4,
                        }}
                      >
                        {n.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                paddingTop: 12,
                borderTop: "1px solid var(--a-border)",
              }}
            >
              <button className="btn btn-primary" onClick={() => setSelectedMilestone(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Milestone Modal */}
      {isAddingMilestone && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--a-panel)",
              border: "1px solid var(--a-border)",
              borderRadius: 14,
              padding: 24,
              width: "100%",
              maxWidth: 540,
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={18} color="var(--a-accent)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  Add Statutory Milestone Track
                </h3>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setIsAddingMilestone(false)}
                style={{ padding: "4px 8px" }}
              >
                <X size={14} />
              </button>
            </div>

            <form
              onSubmit={handleCreateMilestone}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">Case Ref</label>
                  <input
                    type="text"
                    className="search-box"
                    value={newMilestone.caseRef}
                    onChange={(e) => setNewMilestone({ ...newMilestone, caseRef: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Milestone Title</label>
                  <input
                    type="text"
                    className="search-box"
                    placeholder="e.g., Section 161 CrPC In-Camera Witness Statements"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">Responsible Agency</label>
                  <input
                    type="text"
                    className="search-box"
                    placeholder="e.g., State Police QRT"
                    value={newMilestone.agency}
                    onChange={(e) => setNewMilestone({ ...newMilestone, agency: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Lead Nodal Officer</label>
                  <input
                    type="text"
                    className="search-box"
                    placeholder="e.g., ACP V. Gaikwad"
                    value={newMilestone.leadOfficer}
                    onChange={(e) =>
                      setNewMilestone({ ...newMilestone, leadOfficer: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">Statutory Priority</label>
                  <select
                    className="search-box"
                    value={newMilestone.priority}
                    onChange={(e) =>
                      setNewMilestone({
                        ...newMilestone,
                        priority: e.target.value as MilestoneItem["priority"],
                      })
                    }
                  >
                    <option value="critical">Critical (Immediate Danger / Sec 15A)</option>
                    <option value="high">High (48h Statutory Mandate)</option>
                    <option value="medium">Medium (60-Day Court Filing)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Starting Phase</label>
                  <select
                    className="search-box"
                    value={newMilestone.startPhaseIndex}
                    onChange={(e) =>
                      setNewMilestone({
                        ...newMilestone,
                        startPhaseIndex: parseInt(e.target.value),
                      })
                    }
                  >
                    {PHASES.map((p, idx) => (
                      <option key={p.id} value={idx}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">Phase Span</label>
                  <select
                    className="search-box"
                    value={newMilestone.spanPhases}
                    onChange={(e) =>
                      setNewMilestone({ ...newMilestone, spanPhases: parseInt(e.target.value) })
                    }
                  >
                    <option value={1}>1 Phase Duration</option>
                    <option value={2}>2 Phases Duration</option>
                    <option value={3}>3 Phases Duration</option>
                    <option value={4}>4 Phases Duration</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Target SLA / Deadline</label>
                  <input
                    type="text"
                    className="search-box"
                    placeholder="e.g., 24h statutory deadline"
                    value={newMilestone.targetDeadline}
                    onChange={(e) =>
                      setNewMilestone({ ...newMilestone, targetDeadline: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddingMilestone(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
