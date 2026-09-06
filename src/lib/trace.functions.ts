/**
 * TRACE backend endpoints (typed RPC callable from the client).
 *
 * Public (unauthenticated) surface:
 *  - submitInteraction  : consent-gated intake + full analysis pipeline
 *  - getStatusByRef     : anonymous caller status lookup (no PII)
 * Authenticated surface:
 *  - getCaseDashboard   : RLS-aware, role-filtered case list (no PII by default)
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SubmitInput = z.object({
  channel: z.enum(["voice", "chatbot", "ivrs", "webform", "app"]),
  languageCode: z.string().min(2).max(8).default("auto"),
  rawText: z.string().max(20000).optional(),
  audioUrl: z.string().url().optional(),
  consentGiven: z.boolean(),
});

export const submitInteraction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const {
      analyzeTextSignals,
      analyzeVoiceSignals,
      computeSvi,
      generateRecommendation,
    } = await import("./trace/pipeline.server");

    if (!data.rawText && !data.audioUrl) {
      throw new Error("Provide either text or an audio URL");
    }

    const now = new Date().toISOString();
    const { data: interaction, error } = await supabaseAdmin
      .from("interactions")
      .insert({
        channel: data.channel,
        language_code: data.languageCode === "auto" ? "en" : data.languageCode,
        raw_text: data.rawText ?? null,
        audio_url: data.audioUrl ?? null,
        consent_given: data.consentGiven,
        consent_timestamp: data.consentGiven ? now : null,
        consent_pending: !data.consentGiven,
      })
      .select("id, anonymized_ref_id, consent_given")
      .single();
    if (error || !interaction) throw new Error(`Intake failed: ${error?.message}`);

    // CONSENT GATE: without consent we store the record only, no analysis.
    if (!interaction.consent_given) {
      return {
        interactionId: interaction.id,
        anonymizedRefId: interaction.anonymized_ref_id,
        consentPending: true,
        analysis: null,
      };
    }

    if (data.audioUrl) {
      await analyzeVoiceSignals({
        interactionId: interaction.id,
        audioUrl: data.audioUrl,
        languageCode: data.languageCode,
      });
    } else {
      await analyzeTextSignals({
        interactionId: interaction.id,
        rawText: data.rawText!,
        languageCode: data.languageCode,
      });
    }

    const svi = await computeSvi(interaction.id);
    const recommendation = await generateRecommendation(svi.assessmentId);

    return {
      interactionId: interaction.id,
      anonymizedRefId: interaction.anonymized_ref_id,
      consentPending: false,
      analysis: {
        sviScore: svi.sviScore,
        riskCategory: svi.riskCategory,
        traumaIndicators: svi.traumaIndicators,
        breakdown: svi.breakdown,
        actionType: recommendation.actionType,
        priority: recommendation.priority,
        assignedAuthority: recommendation.assignedAuthority,
        escalated: recommendation.escalated,
        notified: recommendation.notified,
      },
    };
  });

/** Anonymous self-service status lookup via the non-guessable reference id. */
export const getStatusByRef = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ refId: z.string().min(8) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: interaction } = await supabaseAdmin
      .from("interactions")
      .select("id, consent_pending, created_at")
      .eq("anonymized_ref_id", data.refId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!interaction) return null;

    const { data: assessment } = await supabaseAdmin
      .from("svi_assessments")
      .select("id, svi_score, risk_category, trauma_indicators, computed_at")
      .eq("interaction_id", interaction.id)
      .is("deleted_at", null)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const recommendation = assessment
      ? (
          await supabaseAdmin
            .from("recommendations")
            .select("action_type, priority, status")
            .eq("svi_assessment_id", assessment.id)
            .is("deleted_at", null)
            .maybeSingle()
        ).data
      : null;

    // Never returns raw text, audio, or identity data.
    return {
      consentPending: interaction.consent_pending,
      createdAt: interaction.created_at,
      sviScore: assessment?.svi_score ?? null,
      riskCategory: assessment?.risk_category ?? null,
      traumaIndicators: assessment?.trauma_indicators ?? [],
      recommendation,
    };
  });

/** Role-filtered dashboard read. RLS decides what the caller can see. */
export const getCaseDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roleList = (roles ?? []).map((r) => r.role as string);
    const isPrivileged = roleList.includes("admin") || roleList.includes("counsellor");

    const { data: assessments } = await supabase
      .from("svi_assessments")
      .select("id, interaction_id, svi_score, risk_category, trauma_indicators, computed_at")
      .is("deleted_at", null)
      .order("computed_at", { ascending: false })
      .limit(200);

    const { data: recommendations } = await supabase
      .from("recommendations")
      .select("id, svi_assessment_id, action_type, priority, status, assigned_authority")
      .is("deleted_at", null)
      .limit(500);

    const list = (assessments ?? []).map((a) => ({
      assessmentId: a.id,
      sviScore: a.svi_score,
      riskCategory: a.risk_category,
      traumaIndicators: a.trauma_indicators,
      computedAt: a.computed_at,
      // Raw text/audio is never surfaced here, even for privileged roles.
      recommendations: (recommendations ?? []).filter((r) => r.svi_assessment_id === a.id),
    }));

    return {
      roles: roleList,
      canSeeCaseDetail: isPrivileged,
      totals: {
        cases: list.length,
        critical: list.filter((c) => c.riskCategory === "critical").length,
        high: list.filter((c) => c.riskCategory === "high").length,
      },
      cases: list,
    };
  });
