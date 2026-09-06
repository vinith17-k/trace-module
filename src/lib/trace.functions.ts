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

const DashboardInput = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
});

/** Role-filtered dashboard read with pagination. RLS decides what the caller can see. */
export const getCaseDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DashboardInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { page, pageSize } = data;
    const offset = (page - 1) * pageSize;

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roleList = (roles ?? []).map((r) => r.role as string);
    const isPrivileged = roleList.includes("admin") || roleList.includes("counsellor");

    const { data: assessments, count: totalCount } = await supabase
      .from("svi_assessments")
      .select("id, interaction_id, svi_score, risk_category, trauma_indicators, computed_at", { count: "exact" })
      .is("deleted_at", null)
      .order("computed_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    const assessmentIds = (assessments ?? []).map((a) => a.id);

    const { data: recommendations } = assessmentIds.length
      ? await supabase
          .from("recommendations")
          .select("id, svi_assessment_id, action_type, priority, status, assigned_authority")
          .is("deleted_at", null)
          .in("svi_assessment_id", assessmentIds)
      : { data: [] };

    const list = (assessments ?? []).map((a) => ({
      assessmentId: a.id,
      sviScore: a.svi_score,
      riskCategory: a.risk_category,
      traumaIndicators: a.trauma_indicators,
      computedAt: a.computed_at,
      // Raw text/audio is never surfaced here, even for privileged roles.
      recommendations: (recommendations ?? []).filter((r) => r.svi_assessment_id === a.id),
    }));

    const total = totalCount ?? 0;

    return {
      roles: roleList,
      canSeeCaseDetail: isPrivileged,
      totals: {
        cases: total,
        critical: list.filter((c) => c.riskCategory === "critical").length,
        high: list.filter((c) => c.riskCategory === "high").length,
      },
      cases: list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  });

/* ------------------------------------------------------------------ */
/* linkVictimIdentity — admin / counsellor only                         */
/* ------------------------------------------------------------------ */

const LinkIdentityInput = z.object({
  interactionId: z.string().uuid(),
  fullName: z.string().min(1).max(255).optional(),
  contactNumber: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(1000).optional(),
  assignedCounsellorId: z.string().uuid().optional(),
});

/**
 * Create or update a victim_identity record and link it to an interaction.
 * Requires admin or counsellor role. All PII lives in victim_identity only,
 * never surfaced in interactions or logs.
 */
export const linkVictimIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LinkIdentityInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Role gate: only admin or counsellor may access PII.
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roleList = (roles ?? []).map((r) => r.role as string);
    if (!roleList.includes("admin") && !roleList.includes("counsellor")) {
      throw new Error("Forbidden: only admin or counsellor roles may manage victim identity");
    }

    // Check the interaction exists and is not soft-deleted.
    const { data: interaction, error: iErr } = await supabase
      .from("interactions")
      .select("id, identity_ref")
      .eq("id", data.interactionId)
      .is("deleted_at", null)
      .maybeSingle();
    if (iErr || !interaction) throw new Error("Interaction not found");

    let identityId: string;

    if (interaction.identity_ref) {
      // Update existing PII record.
      const { error: uErr } = await supabase
        .from("victim_identity")
        .update({
          ...(data.fullName !== undefined && { full_name: data.fullName }),
          ...(data.contactNumber !== undefined && { contact_number: data.contactNumber }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.assignedCounsellorId !== undefined && { assigned_counsellor_id: data.assignedCounsellorId }),
        })
        .eq("id", interaction.identity_ref);
      if (uErr) throw new Error(`victim_identity update failed: ${uErr.message}`);
      identityId = interaction.identity_ref;
    } else {
      // Insert new PII record.
      const { data: inserted, error: insErr } = await supabase
        .from("victim_identity")
        .insert({
          full_name: data.fullName ?? null,
          contact_number: data.contactNumber ?? null,
          email: data.email ?? null,
          address: data.address ?? null,
          assigned_counsellor_id: data.assignedCounsellorId ?? null,
        })
        .select("id")
        .single();
      if (insErr || !inserted) throw new Error(`victim_identity insert failed: ${insErr?.message}`);
      identityId = inserted.id;

      // Link the interaction → victim_identity via non-guessable UUID.
      const { error: linkErr } = await supabase
        .from("interactions")
        .update({ identity_ref: identityId })
        .eq("id", data.interactionId);
      if (linkErr) throw new Error(`interactions update failed: ${linkErr.message}`);
    }

    return { identityId, interactionId: data.interactionId, linked: true };
  });
