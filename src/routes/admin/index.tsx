import { createFileRoute } from '@tanstack/react-router';
import { StaffLayout } from '@/components/trace/StaffLayout';
import { ManagementWorkspace } from '@/components/trace/management/ManagementWorkspace';

export const Route = createFileRoute('/admin/')({
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  return (
    <StaffLayout mode="admin">
      <ManagementWorkspace />
    </StaffLayout>
  );
}
