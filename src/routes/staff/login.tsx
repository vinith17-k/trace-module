import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/staff/login")({
  component: StaffLoginPage,
});

function StaffLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const doLoginWithRole = (emailVal: string, roleVal: string, nameVal: string, targetPath: "/staff/queue" | "/staff/police" | "/admin") => {
    setError(false);
    sessionStorage.setItem(
      "trace_staff_user",
      JSON.stringify({ email: emailVal, role: roleVal, name: nameVal }),
    );
    navigate({ to: targetPath });
  };

  const doLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(true);
      return;
    }
    setError(false);
    const lower = email.toLowerCase();
    const role = lower.includes("admin")
      ? "admin"
      : lower.includes("police")
        ? "law_enforcement"
        : "counsellor";
    const name = lower.includes("admin")
      ? "Dr. Ramesh Iyer"
      : lower.includes("police")
        ? "SI Rakesh Yadav"
        : "Priya S.";
    const targetPath =
      role === "admin"
        ? "/admin"
        : role === "law_enforcement"
          ? "/staff/police"
          : "/staff/queue";

    sessionStorage.setItem(
      "trace_staff_user",
      JSON.stringify({ email, role, name }),
    );
    navigate({ to: targetPath });
  };

  return (
    <div
      className="auth"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100%",
        padding: 20,
      }}
    >
      <form
        style={{
          background: "var(--a-panel)",
          border: "1px solid var(--a-border)",
          borderRadius: 16,
          padding: "36px 34px",
          maxWidth: 400,
          width: "100%",
        }}
        onSubmit={doLogin}
      >
        <Link to="/" className="pub-logo" style={{ marginBottom: 20, color: "#fff", fontSize: 18 }}>
          <span className="dot" />
          TRACE · Staff Portal
        </Link>
        <p style={{ fontSize: 12.5, color: "var(--a-muted)", margin: "0 0 14px" }}>
          Sign in with your authorised account or choose a demo role:
        </p>

        {/* 1-Click Demo Logins */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: 12, textAlign: "left", display: "flex", justifyContent: "space-between", padding: "6px 10px" }}
            onClick={() => doLoginWithRole("priya.s@nhaa.gov.in", "counsellor", "Priya S.", "/staff/queue")}
          >
            <span>🧑‍⚕️ Quick Demo: <b>Counsellor</b> (Priya S.)</span>
            <span style={{ opacity: 0.6 }}>Queue →</span>
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: 12, textAlign: "left", display: "flex", justifyContent: "space-between", padding: "6px 10px" }}
            onClick={() => doLoginWithRole("r.yadav@police.mh.gov.in", "law_enforcement", "SI Rakesh Yadav", "/staff/police")}
          >
            <span>👮 Quick Demo: <b>Police / Protection</b></span>
            <span style={{ opacity: 0.6 }}>Dispatch →</span>
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: 12, textAlign: "left", display: "flex", justifyContent: "space-between", padding: "6px 10px" }}
            onClick={() => doLoginWithRole("r.iyer@socialjustice.gov.in", "admin", "Dr. Ramesh Iyer", "/admin")}
          >
            <span>⚙️ Quick Demo: <b>System Admin</b></span>
            <span style={{ opacity: 0.6 }}>Admin →</span>
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="field-label" htmlFor="loginEmail">
            Email
          </label>
          <input
            className="field-input"
            type="email"
            id="loginEmail"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label className="field-label" htmlFor="loginPassword">
            Password
          </label>
          <div className="field-wrap">
            <input
              className="field-input"
              type={showPassword ? "text" : "password"}
              id="loginPassword"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: 56 }}
            />
            <button
              type="button"
              className="field-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && (
          <p className="login-error show" id="loginError">
            Enter both an email and a password to continue.
          </p>
        )}

        <button
          className="btn-dash"
          type="submit"
          style={{ width: "100%", padding: 11, marginTop: 8 }}
        >
          Sign in
        </button>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link to="/" style={{ color: "var(--a-muted)", fontSize: 12, textDecoration: "none" }}>
            ← Back to public homepage
          </Link>
        </div>
      </form>
    </div>
  );
}
