import { createFileRoute } from "@tanstack/react-router";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { StaffLayout } from "@/components/trace/StaffLayout";
import { ManagementWorkspace } from "@/components/trace/management/ManagementWorkspace";

export const Route = createFileRoute("/admin/")({
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  useAuthGuard();
  return (
    <StaffLayout mode="admin">
      <ManagementWorkspace />
    </StaffLayout>
  );
}
