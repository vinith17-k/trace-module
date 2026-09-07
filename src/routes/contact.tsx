import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/trace/PublicLayout";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  return (
    <PublicLayout>
      <div className="pub-body">
        <h1>Contact &amp; Feedback</h1>
        <p>
          For anything other than urgent support — feedback on this service, accessibility issues,
          or press inquiries.
        </p>
        <h2>Reach us</h2>
        <p>
          support@nhaa-trace.gov.in · NHAA Toll-Free: 14566 · Ministry of Social Justice &amp;
          Empowerment, New Delhi
        </p>
      </div>
    </PublicLayout>
  );
}
