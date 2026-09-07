import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { StaffLayout } from "@/components/trace/StaffLayout";
import { Toast } from "@/components/trace/Toast";

export const Route = createFileRoute("/staff/escalation")({
  component: EscalationCenterPage,
});

interface NotificationItem {
  id: string;
  target: string;
  priority: string;
  status: "sent" | "pending" | "failed";
}

function EscalationCenterPage() {
  useAuthGuard();
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      target: "NHAA-4F82-K91 → Police (Pune Dist.)",
      priority: "Immediate",
      status: "sent",
    },
    { id: "2", target: "NHAA-2C10-B44 → Legal Aid Cell", priority: "Urgent", status: "sent" },
    {
      id: "3",
      target: "NHAA-9A73-L02 → Counselling Network",
      priority: "Routine",
      status: "pending",
    },
    {
      id: "4",
      target: "NHAA-7E55-Q19 → Medical Assistance",
      priority: "Routine",
      status: "failed",
    },
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const retryFailed = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.status === "failed" ? { ...n, status: "sent" } : n)),
    );
    setToastMessage("Retrying 1 failed notification via authority webhook...");
  };

  return (
    <StaffLayout mode="staff">
      <div className="auth-topline">
        <h2>Escalation & Notification Center</h2>
        <span className="auth-role">Authority Dispatch</span>
      </div>

      <p className="inline-legend" style={{ margin: "0 0 16px", display: "inline-block" }}>
        Badge color here reflects <b style={{ color: "var(--a-text)" }}>delivery status</b>, not
        case risk tier — a failed send is always shown in red regardless of the case's own priority.
      </p>

      <div>
        {notifications.map((n) => (
          <div key={n.id} className="notif-item">
            <span>
              {n.target} · {n.priority}
            </span>
            <span className={`badge notif-${n.status}`}>
              {n.status === "sent" ? "Sent" : n.status === "pending" ? "Pending" : "Failed — retry"}
            </span>
          </div>
        ))}
      </div>

      <button type="button" className="btn-ghost" style={{ marginTop: 12 }} onClick={retryFailed}>
        Retry failed notifications
      </button>

      {toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage(null)} />}
    </StaffLayout>
  );
}
