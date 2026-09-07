import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/trace/PublicLayout";

export const Route = createFileRoute("/")({
  component: PublicHome,
});

function PublicHome() {
  return (
    <PublicLayout>
      <div className="pub-hero">
        <div>
          <h1>Someone is ready to listen, right now.</h1>
          <p>
            TRACE connects you to counselling, legal aid, and protection through NHAA (14566) — in
            your language, at your pace, and only with your consent.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              to="/support"
              className="btn"
              style={{ background: "var(--pub-terracotta)", color: "#fff" }}
            >
              Get support now
            </Link>
            <Link
              to="/about"
              className="btn"
              style={{
                background: "transparent",
                border: "1.5px solid #cfc6b0",
                color: "var(--pub-ink)",
              }}
            >
              How it works
            </Link>
          </div>
        </div>
        <div className="blob-art">
          <div className="b1" />
          <div className="b2" />
          <div className="b3" />
        </div>
      </div>

      <div className="pub-strip">
        <div className="wrap">
          <div className="pub-step">
            <div className="n">01</div>
            <h3>You reach out</h3>
            <p>By chat, voice, or the NHAA helpline — anonymously if you choose.</p>
          </div>
          <div className="pub-step">
            <div className="n">02</div>
            <h3>We listen carefully</h3>
            <p>A short, gentle conversation, never a form to fill out.</p>
          </div>
          <div className="pub-step">
            <div className="n">03</div>
            <h3>You get connected</h3>
            <p>To a counsellor, legal aid, or emergency support — matched to what you need.</p>
          </div>
        </div>
      </div>

      <div className="pub-trust">
        <h2>Built with, and for, the people who need it</h2>
        <div className="trust-badges">
          <div className="trust-badge">Ministry of Social Justice & Empowerment</div>
          <div className="trust-badge">Data encrypted & confidential</div>
          <div className="trust-badge">National Helpline Against Atrocities · 14566</div>
          <div className="trust-badge">Available in 8 Indian languages</div>
        </div>
      </div>
    </PublicLayout>
  );
}
