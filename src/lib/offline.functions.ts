/**
 * Offline-capable SOS intake: queue + auto-sync endpoints.
 *
 * syncOfflineCapture — called once connectivity returns. Records the original
 * offline capture in `offline_queue` (synced=false), creates the interaction
 * stamped with the ACTUAL capture time, runs the existing analysis pipeline,
 * then marks the queue row synced.
 *
 * listOfflineSyncedRefs — staff-side helper so the case queue can tag cases
 * that were originally captured offline.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const OfflineCaptureInput = z.object({
  channel: z.enum(["voice", "chatbot", "ivrs", "webform", "app"]).default("app"),
  languageCode: z.string().min(2).max(8).default("en"),
  rawText: z.string().min(1).max(20000),
  consentGiven: z.boolean(),
  capturedAt: z.string(),
  gpsLat: z.number().nullable().optional(),
  gpsLng: z.number().nullable().optional(),
  clientRef: z.string().max(128).optional(),
});

export const syncOfflineCapture = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => OfflineCaptureInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runFullPipeline } = await import("./trace/pipeline.server");
    const { hashReferenceId } = await import("./trace/security.server");

    const capturedAt = new Date(data.capturedAt).toISOString();

    // 1. Persist the raw offline capture first (unsynced).
    const { data: queued, error: queueError } = await supabaseAdmin
      .from("offline_queue")
      .insert({
        payload: {
          channel: data.channel,
          languageCode: data.languageCode,
          rawText: data.rawText,
          consentGiven: data.consentGiven,
          clientRef: data.clientRef ?? null,
        },
        gps_lat: data.gpsLat ?? null,
        gps_lng: data.gpsLng ?? null,
        captured_at: capturedAt,
        synced: false,
      })
      .select("id")
      .single();

    if (queueError || !queued) throw new Error(`Offline queue write failed: ${queueError?.message}`);

    // 2. Create the interaction, stamped with the original capture moment.
    const refId = `NHAA-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 5)
      .toUpperCase()}`;

    const { data: interaction, error } = await supabaseAdmin
      .from("interactions")
      .insert({
        channel: data.channel,
        language_code: data.languageCode,
        raw_text: data.rawText,
        consent_given: data.consentGiven,
        consent_timestamp: data.consentGiven ? capturedAt : null,
        consent_pending: !data.consentGiven,
        anonymized_ref_id: refId,
        anonymized_ref_hash: hashReferenceId(refId),
        created_at: capturedAt,
        pipeline_status: data.consentGiven ? "analyzing" : "pending",
      })
      .select("id, anonymized_ref_id, consent_given")
      .single();

    if (error || !interaction) throw new Error(`Offline sync intake failed: ${error?.message}`);

    // 3. Mark the queue row synced and link it to the interaction.
    await supabaseAdmin
      .from("offline_queue")
      .update({
        synced: true,
        synced_at: new Date().toISOString(),
        interaction_id: interaction.id,
      })
      .eq("id", queued.id);

    // 4. Consent gate — analysis only runs with consent.
    if (!interaction.consent_given) {
      return {
        queueId: queued.id,
        interactionId: interaction.id,
        anonymizedRefId: interaction.anonymized_ref_id,
        capturedAt,
        analysis: null,
      };
    }

    const result = await runFullPipeline(interaction.id);

    return {
      queueId: queued.id,
      interactionId: interaction.id,
      anonymizedRefId: interaction.anonymized_ref_id,
      capturedAt,
      analysis: {
        sviScore: result.svi.sviScore,
        riskCategory: result.svi.riskCategory,
        traumaIndicators: result.svi.traumaIndicators,
        actionType: result.recommendation.actionType,
        priority: result.recommendation.priority,
      },
    };
  });

/** Staff-side: reference ids of cases that were originally captured offline. */
export const listOfflineSyncedRefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows } = await context.supabase
      .from("offline_queue")
      .select("interaction_id, captured_at, synced_at")
      .eq("synced", true)
      .not("interaction_id", "is", null)
      .order("captured_at", { ascending: false })
      .limit(500);

    const ids = (rows ?? []).map((r) => r.interaction_id).filter(Boolean) as string[];
    if (ids.length === 0) return { offlineCases: [] as Array<Record<string, unknown>> };

    const { data: interactions } = await context.supabase
      .from("interactions")
      .select("id, anonymized_ref_id")
      .in("id", ids);

    const refById = new Map((interactions ?? []).map((i) => [i.id, i.anonymized_ref_id]));

    return {
      offlineCases: (rows ?? [])
        .filter((r) => r.interaction_id && refById.has(r.interaction_id))
        .map((r) => ({
          refId: refById.get(r.interaction_id as string),
          capturedAt: r.captured_at,
          syncedAt: r.synced_at,
        })),
    };
  });
