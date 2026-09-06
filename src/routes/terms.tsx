import { createFileRoute } from '@tanstack/react-router';
import { PublicLayout } from '@/components/trace/PublicLayout';

export const Route = createFileRoute('/terms')({
  component: TermsPage,
});

function TermsPage() {
  return (
    <PublicLayout>
      <div className="pub-body">
        <h1>Terms of Service</h1>
        <p>
          TRACE is a free government service offered under NHAA and the Ministry of Social Justice &amp; Empowerment. It is a support and triage tool, not a replacement for professional medical, psychiatric, or legal advice.
        </p>
        <h2>Fair use</h2>
        <p>
          This service exists to support victims and complainants of caste-based atrocities. Please use it honestly and respectfully.
        </p>
        <h2>Availability</h2>
        <p>
          TRACE aims to be available 24/7 across chat, voice, IVRS, and the integrated portal, though occasional maintenance windows may apply.
        </p>
      </div>
    </PublicLayout>
  );
}
