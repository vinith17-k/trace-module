import { createFileRoute } from '@tanstack/react-router';
import { PublicLayout } from '@/components/trace/PublicLayout';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="pub-body">
        <h1>Privacy Policy</h1>
        <p>
          Your identity is only ever visible to a counsellor assigned to your case, and only if you choose to share it. You may use TRACE anonymously and check on your case later using a reference ID.
        </p>
        <h2>What we store</h2>
        <p>
          Your message or voice recording, a derived distress score, and any recommended next step. Raw recordings are never shared beyond the analysis needed to support you.
        </p>
        <h2>Who can see what</h2>
        <p>
          Counsellors see cases assigned to them. Law enforcement only sees cases explicitly flagged for police intervention or witness protection. Every access is logged.
        </p>
        <h2>Your consent</h2>
        <p>
          You can withdraw consent at any point in the conversation, and choose not to continue at any time without penalty.
        </p>
      </div>
    </PublicLayout>
  );
}
