// generate-recommendation — Supabase Edge Function
// Input:  { svi_assessment_id }
// Output: { recommendation_id, action_type, priority, assigned_authority, escalated, notified }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { svi_assessment_id } = await req.json();
    if (!svi_assessment_id) {
      return new Response(JSON.stringify({ error: "svi_assessment_id is required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data: assessment, error: aErr } = await db
      .from("svi_assessments")
      .select("id, risk_category, trauma_indicators, interaction_id")
      .eq("id", svi_assessment_id)
      .single();
    if (aErr || !assessment) {
      return new Response(JSON.stringify({ error: "Assessment not found" }), {
        status: 404,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const indicators = (assessment.trauma_indicators ?? []) as string[];

    // Load rules from DB (config-driven, not inline).
    const { data: rules } = await db
      .from("recommendation_rules")
      .select("*")
      .eq("active", true)
      .order("rule_order", { ascending: true });

    const rule =
      (rules ?? []).find(
        (r: Record<string, unknown>) =>
          r["risk_category"] === assessment.risk_category &&
          (r["required_indicator"] === null ||
            indicators.includes(r["required_indicator"] as string)),
      ) ?? null;

    const actionType = (rule?.["action_type"] ?? "counselling") as string;
    const priority = (rule?.["priority"] ?? "routine") as string;

    const { data: rec, error: rErr } = await db
      .from("recommendations")
      .insert({
        svi_assessment_id,
        action_type: actionType as never,
        priority: priority as never,
        assigned_authority: rule?.["assigned_authority"] ?? null,
        status: "pending",
      })
      .select("id")
      .single();
    if (rErr || !rec) throw new Error(`recommendations insert failed: ${rErr?.message}`);

    const criticalEscalation =
      assessment.risk_category === "critical" &&
      (indicators.includes("suicidal_ideation") || indicators.includes("intimidation"));
    const escalate =
      Boolean(rule?.["auto_escalate"]) || criticalEscalation || priority === "immediate";

    if (escalate) {
      await db.from("escalation_log").insert({
        recommendation_id: (rec as { id: string }).id,
        actor: "system:generate-recommendation",
        action_taken: "auto_escalated",
        notes: `risk=${assessment.risk_category}; indicators=${indicators.join(",") || "none"}`,
      });
    }

    let notified = false;
    if (
      priority === "immediate" ||
      actionType === "police_intervention" ||
      actionType === "witness_protection"
    ) {
      // Chain to notify-authority edge function.
      const fnUrl = `${supabaseUrl}/functions/v1/notify-authority`;
      const notifyRes = await fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ recommendation_id: (rec as { id: string }).id }),
      });
      notified = notifyRes.ok;
    }

    return new Response(
      JSON.stringify({
        recommendation_id: (rec as { id: string }).id,
        action_type: actionType,
        priority,
        assigned_authority: rule?.["assigned_authority"] ?? null,
        escalated: escalate,
        notified,
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
