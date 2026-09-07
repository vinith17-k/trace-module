import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/staff/login')({
  component: StaffLoginPage,
});

function StaffLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const doLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(true);
      return;
    }
    setError(false);
    // In prototype mode, store authenticated state in sessionStorage and navigate
    sessionStorage.setItem('trace_staff_user', JSON.stringify({ email, role: 'counsellor', name: 'Priya S.' }));
    navigate({ to: '/staff/queue' });
  };

  return (
    <div
      className="auth"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        padding: 20,
      }}
    >
      <form
        style={{
          background: 'var(--a-panel)',
          border: '1px solid var(--a-border)',
          borderRadius: 16,
          padding: '36px 34px',
          maxWidth: 360,
          width: '100%',
        }}
        onSubmit={doLogin}
      >
        <Link to="/" className="pub-logo" style={{ marginBottom: 20, color: '#fff', fontSize: 18 }}>
          <span className="dot" />
          TRACE · Staff Portal
        </Link>
        <p style={{ fontSize: 12.5, color: 'var(--a-muted)', margin: '0 0 18px' }}>
          Sign in with your authorised account (Prototype mode pre-filled)
        </p>
        <p style={{ fontSize: 11.5, color: 'var(--a-muted)', margin: '0 0 12px', padding: '8px 12px', background: 'rgba(91,141,239,0.08)', borderRadius: 6, border: '1px solid rgba(91,141,239,0.2)' }}>Demo: counsellor@nhaa.gov.in / demoPassword123</p>

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
              type={showPassword ? 'text' : 'password'}
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
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
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
          style={{ width: '100%', padding: 11, marginTop: 8 }}
        >
          Sign in
        </button>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--a-muted)', fontSize: 12, textDecoration: 'none' }}>
            ← Back to public homepage
          </Link>
        </div>
      </form>
    </div>
  );
}
