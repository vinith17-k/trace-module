import { createFileRoute, Link } from '@tanstack/react-router';
import { PublicLayout } from '@/components/trace/PublicLayout';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicLayout>
      <div className="pub-body">
        <h1>How TRACE works</h1>
        <p>
          When you contact NHAA (14566), the chatbot, IVRS, or the integrated portal, TRACE listens to what you share — through voice or text — and gently assesses your level of distress so the right support reaches you as fast as possible.
        </p>
        <h2>What TRACE looks for</h2>
        <p>
          Signs of fear, depression, suicidal thoughts, intimidation, and social isolation — never to judge you, only to understand how urgently you need help.
        </p>
        <h2>What happens next</h2>
        <p>
          Depending on what you've shared, we may connect you with a counsellor, legal aid, medical assistance, police intervention, or witness protection. You'll always be told what's happening and why.
        </p>
        <h2>Who's involved</h2>
        <p>
          Department of Social Justice and Empowerment, State Governments, District Administrations, mental health professionals, law enforcement, and rehabilitation authorities — all working from the same, secure case record.
        </p>
        <div style={{ marginTop: 36 }}>
          <Link
            to="/support"
            className="btn"
            style={{ background: 'var(--pub-terracotta)', color: '#fff' }}
          >
            Get support now
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
