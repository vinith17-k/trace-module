// get-case-dashboard — Supabase Edge Function
// Input:  Bearer JWT in Authorization header, optional { page?, page_size? } body
// Output: { roles, can_see_case_detail, totals, cases, pagination }
//
// RLS is enforced: the user-scoped Supabase client is used for all reads,
// so policies in the DB decide what rows are visible.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const publishableKey =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    // Extract user JWT from Authorization header.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    // User-scoped client (respects RLS).
    const supabase = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Parse pagination params.
    let page = 1;
    let pageSize = DEFAULT_PAGE_SIZE;
    try {
      const body = await req.json();
      page = Math.max(1, Number(body?.page ?? 1));
      pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(body?.page_size ?? DEFAULT_PAGE_SIZE)));
    } catch {
      // No body — use defaults.
    }
    const offset = (page - 1) * pageSize;

    // Fetch roles for the calling user.
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roleList = (roles ?? []).map((r: { role: string }) => r.role);
    const isPrivileged = roleList.includes("admin") || roleList.includes("counsellor");

    // Paginated assessments (RLS filters rows automatically).
    const { data: assessments, count: totalAssessments } = await supabase
      .from("svi_assessments")
      .select("id, interaction_id, svi_score, risk_category, trauma_indicators, computed_at", {
        count: "exact",
      })
      .is("deleted_at", null)
      .order("computed_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    const assessmentIds = (assessments ?? []).map((a: { id: string }) => a.id);

    const { data: recommendations } = assessmentIds.length
      ? await supabase
          .from("recommendations")
          .select("id, svi_assessment_id, action_type, priority, status, assigned_authority")
          .is("deleted_at", null)
          .in("svi_assessment_id", assessmentIds)
      : { data: [] };

    const cases = (assessments ?? []).map(
      (a: {
        id: string;
        svi_score: number;
        risk_category: string;
        trauma_indicators: string[];
        computed_at: string;
      }) => ({
        assessment_id: a.id,
        svi_score: a.svi_score,
        risk_category: a.risk_category,
        trauma_indicators: a.trauma_indicators,
        computed_at: a.computed_at,
        // Raw text/audio is never surfaced here, even for privileged roles.
        recommendations: (recommendations ?? []).filter(
          (r: { svi_assessment_id: string }) => r.svi_assessment_id === a.id,
        ),
      }),
    );

    const total = totalAssessments ?? 0;

    return new Response(
      JSON.stringify({
        roles: roleList,
        can_see_case_detail: isPrivileged,
        totals: {
          cases: total,
          critical: cases.filter((c) => c.risk_category === "critical").length,
          high: cases.filter((c) => c.risk_category === "high").length,
        },
        cases,
        pagination: {
          page,
          page_size: pageSize,
          total,
          total_pages: Math.ceil(total / pageSize),
        },
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
