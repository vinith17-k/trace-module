import { createFileRoute } from '@tanstack/react-router';
import { PublicLayout } from '@/components/trace/PublicLayout';

export const Route = createFileRoute('/resources')({
  component: ResourcesPage,
});

function ResourcesPage() {
  return (
    <PublicLayout>
      <div className="pub-body">
        <h1>Resources</h1>
        <p>
          Information you can look through at your own pace — no assessment, no data collected on this page.
        </p>

        <div className="resource-card">
          <h3>Recognising distress in yourself or someone else</h3>
          <p>
            Common signs of fear, withdrawal, and anxiety after a traumatic event, and when to reach out.
          </p>
        </div>

        <div className="resource-card">
          <h3>Your legal rights under the SC/ST (Prevention of Atrocities) Act</h3>
          <p>
            A plain-language overview of protections and how to file a complaint.
          </p>
        </div>

        <div className="resource-card">
          <h3>Organisations that can help</h3>
          <p>
            A directory of legal aid clinics, counselling services, and rehabilitation authorities by state.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
