import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

/**
 * Redirects to /staff/login if the session has no authenticated staff user.
 * Usage: call at the top of any staff/admin route component.
 */
export function useAuthGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("trace_staff_user");
      if (!raw) {
        navigate({ to: "/staff/login" });
      }
    } catch {
      navigate({ to: "/staff/login" });
    }
  }, [navigate]);
}
