// notify-authority — Supabase Edge Function
// Input:  { recommendation_id }
// Output: { outbox_id }
//
// TODO: Replace the stub below with a real delivery provider.
//       Supported channels to plug in:
//         - SMS: Twilio / Kaleyra / MSG91 (for India)
//         - Email: SendGrid / AWS SES
//         - Webhook: POST to district authority endpoint
//         - Push: Firebase FCM for law enforcement app
//       Contract: set notification_outbox.status = 'sent' | 'failed' based on provider response.

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

    const { recommendation_id } = await req.json();
    if (!recommendation_id) {
      return new Response(JSON.stringify({ error: "recommendation_id is required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data: rec, error } = await db
      .from("recommendations")
      .select("id, action_type, priority, assigned_authority, svi_assessment_id")
      .eq("id", recommendation_id)
      .single();
    if (error || !rec) {
      return new Response(JSON.stringify({ error: "Recommendation not found" }), {
        status: 404,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Payload deliberately contains NO PII and no raw text/transcript.
    const payload = {
      recommendation_id: (rec as { id: string }).id,
      action_type: (rec as { action_type: string }).action_type,
      priority: (rec as { priority: string }).priority,
      assigned_authority: (rec as { assigned_authority: string | null }).assigned_authority,
      dispatched_by: "trace-notify-authority-edge",
    };

    // TODO: actual delivery — plug in SMS/email/webhook here.
    // Example stub for webhook:
    // const webhookUrl = Deno.env.get("AUTHORITY_WEBHOOK_URL");
    // if (webhookUrl) {
    //   const deliveryRes = await fetch(webhookUrl, { method: "POST", body: JSON.stringify(payload) });
    //   outboxStatus = deliveryRes.ok ? "sent" : "failed";
    // }
    const outboxStatus = "queued"; // change to "sent" after implementing real delivery

    const { data: outbox, error: oErr } = await db
      .from("notification_outbox")
      .insert({
        recommendation_id: (rec as { id: string }).id,
        channel: "webhook",
        target: (rec as { assigned_authority: string | null }).assigned_authority,
        payload,
        status: outboxStatus,
      })
      .select("id")
      .single();
    if (oErr || !outbox) throw new Error(`notification_outbox insert failed: ${oErr?.message}`);

    await db
      .from("recommendations")
      .update({ status: "dispatched", dispatched_at: new Date().toISOString() })
      .eq("id", (rec as { id: string }).id);

    await db.from("escalation_log").insert({
      recommendation_id: (rec as { id: string }).id,
      actor: "system:notify-authority-edge",
      action_taken: "notification_queued",
      notes: `channel=webhook; target=${(rec as { assigned_authority: string | null }).assigned_authority ?? "unassigned"}; status=${outboxStatus}`,
    });

    return new Response(
      JSON.stringify({ outbox_id: (outbox as { id: string }).id, status: outboxStatus }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
