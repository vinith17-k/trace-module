/**
 * TRACE backend endpoints (typed RPC callable from the client).
 *
 * Public (unauthenticated) surface:
 *  - submitInteraction       : consent-gated intake, rate-limited, idempotent + full pipeline
 *  - getStatusByRef          : anonymous caller status lookup, throttled against brute-force
 *  - getSystemHealth         : health-check endpoint for DB, AI gateway and pipeline backlog
 * Authenticated surface:
 *  - getCaseDashboard        : RLS-aware, role-filtered case list (no PII by default)
 *  - linkVictimIdentity      : encrypted PII store linked to interaction
 *  - recordAssessmentOutcome : ground-truth validation feedback for risk thresholds
 *  - rerunInteractionPipeline: re-evaluates an interaction with full telemetry
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
  idempotencyKey: z.string().max(128).optional(),
  async: z.boolean().default(false),
});

export const submitInteraction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runFullPipeline } = await import("./trace/pipeline.server");
    const { hashReferenceId, checkSubmitRateLimit } = await import("./trace/security.server");

    // 1. Rate-limiting check (per-channel or default anonymous bucket)
    const rateCheck = checkSubmitRateLimit(data.idempotencyKey ?? data.channel);
    if (!rateCheck.allowed) {
      throw new Error(
        `Rate limit exceeded. Please wait ${rateCheck.retryAfterSec ?? 60} seconds before submitting.`,
      );
    }

    if (!data.rawText && !data.audioUrl) {
      throw new Error("Provide either text or an audio URL");
    }

    // 2. Idempotency check: prevent duplicate submissions
    if (data.idempotencyKey) {
      const { data: existing } = await supabaseAdmin
        .from("interactions")
        .select("id, anonymized_ref_id, consent_given, pipeline_status")
        .eq("idempotency_key", data.idempotencyKey)
        .is("deleted_at", null)
        .maybeSingle();

      if (existing) {
        // Fetch existing assessment if available
        const { data: assessment } = await supabaseAdmin
          .from("svi_assessments")
          .select("id, svi_score, risk_category, trauma_indicators, partial")
          .eq("interaction_id", existing.id)
          .is("deleted_at", null)
          .order("computed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: recommendation } = assessment
          ? await supabaseAdmin
              .from("recommendations")
              .select("id, action_type, priority, assigned_authority, status")
              .eq("svi_assessment_id", assessment.id)
              .is("deleted_at", null)
              .maybeSingle()
          : { data: null };

        return {
          interactionId: existing.id,
          anonymizedRefId: existing.anonymized_ref_id,
          consentPending: !existing.consent_given,
          pipelineStatus: existing.pipeline_status,
          isDuplicate: true,
          analysis: assessment
            ? {
                sviScore: assessment.svi_score,
                riskCategory: assessment.risk_category,
                traumaIndicators: assessment.trauma_indicators,
                actionType: recommendation?.action_type ?? null,
                priority: recommendation?.priority ?? null,
                assignedAuthority: recommendation?.assigned_authority ?? null,
                status: recommendation?.status ?? null,
                partial: assessment.partial,
              }
            : null,
        };
      }
    }

    // Generate random reference ID for caller
    const refId = `NHAA-${Math.random().toString(36).substring(2, 6).toUpperCase()}-K91`;
    const refHash = hashReferenceId(refId);
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
        anonymized_ref_id: refId,
        anonymized_ref_hash: refHash,
        idempotency_key: data.idempotencyKey ?? null,
        pipeline_status: data.consentGiven ? (data.async ? "pending" : "analyzing") : "pending",
      })
      .select("id, anonymized_ref_id, consent_given, pipeline_status")
      .single();

    if (error || !interaction) throw new Error(`Intake failed: ${error?.message}`);

    // CONSENT GATE: without consent we store the record only, no analysis.
    if (!interaction.consent_given) {
      return {
        interactionId: interaction.id,
        anonymizedRefId: interaction.anonymized_ref_id,
        consentPending: true,
        pipelineStatus: "pending",
        analysis: null,
      };
    }

    // ASYNC PATH: return immediately with non-guessable reference ID
    if (data.async) {
      return {
        interactionId: interaction.id,
        anonymizedRefId: interaction.anonymized_ref_id,
        consentPending: false,
        pipelineStatus: "pending",
        analysis: null,
      };
    }

    // SYNCHRONOUS PATH: run full pipeline end-to-end
    const result = await runFullPipeline(interaction.id);

    return {
      interactionId: interaction.id,
      anonymizedRefId: interaction.anonymized_ref_id,
      consentPending: false,
      pipelineStatus: result.isPartial ? "partial" : "complete",
      analysis: {
        sviScore: result.svi.sviScore,
        riskCategory: result.svi.riskCategory,
        traumaIndicators: result.svi.traumaIndicators,
        breakdown: result.svi.breakdown,
        partial: result.svi.partial,
        configVersion: result.svi.configVersion,
        actionType: result.recommendation.actionType,
        priority: result.recommendation.priority,
        assignedAuthority: result.recommendation.assignedAuthority,
        escalated: result.recommendation.escalated,
        notified: result.recommendation.notified,
      },
    };
  });

/** Anonymous self-service status lookup via the non-guessable reference id. */
export const getStatusByRef = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ refId: z.string().min(8) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { hashReferenceId, checkStatusLookupRateLimit } = await import("./trace/security.server");

    // Throttling protection against brute-force discovery of reference codes
    const rateCheck = checkStatusLookupRateLimit("public_lookup");
    if (!rateCheck.allowed) {
      throw new Error(
        `Too many status lookups. Please wait ${rateCheck.retryAfterSec ?? 60} seconds.`,
      );
    }

    const refHash = hashReferenceId(data.refId);

    // Look up by either SHA-256 hash or plaintext reference for backwards compatibility
    const { data: interaction } = await supabaseAdmin
      .from("interactions")
      .select("id, consent_pending, pipeline_status, created_at")
      .or(
        `anonymized_ref_hash.eq.${refHash},anonymized_ref_id.eq.${data.refId.trim().toUpperCase()}`,
      )
      .is("deleted_at", null)
      .maybeSingle();

    if (!interaction) return null;

    const { data: assessment } = await supabaseAdmin
      .from("svi_assessments")
      .select("id, svi_score, risk_category, trauma_indicators, partial, computed_at")
      .eq("interaction_id", interaction.id)
      .is("deleted_at", null)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const recommendation = assessment
      ? (
          await supabaseAdmin
            .from("recommendations")
            .select("action_type, priority, status, assigned_authority")
            .eq("svi_assessment_id", assessment.id)
            .is("deleted_at", null)
            .maybeSingle()
        ).data
      : null;

    // Never returns raw text, audio, or identity data.
    return {
      consentPending: interaction.consent_pending,
      pipelineStatus: interaction.pipeline_status,
      createdAt: interaction.created_at,
      sviScore: assessment?.svi_score ?? null,
      riskCategory: assessment?.risk_category ?? null,
      traumaIndicators: assessment?.trauma_indicators ?? [],
      partial: assessment?.partial ?? false,
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
      .select(
        "id, interaction_id, svi_score, risk_category, trauma_indicators, partial, computed_at",
        { count: "exact" },
      )
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
      partial: a.partial,
      computedAt: a.computed_at,
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
/* linkVictimIdentity — admin / counsellor only with encryption         */
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
 * Encrypts all PII fields at rest using AES-256-GCM.
 */
export const linkVictimIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LinkIdentityInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { encryptField, decryptField } = await import("./trace/security.server");

    // Role gate: only admin or counsellor may access PII.
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roleList = (roles ?? []).map((r) => r.role as string);
    if (!roleList.includes("admin") && !roleList.includes("counsellor")) {
      throw new Error("Forbidden: only admin or counsellor roles may manage victim identity");
    }

    // Check interaction exists and is not soft-deleted
    const { data: interaction, error: iErr } = await supabase
      .from("interactions")
      .select("id, identity_ref")
      .eq("id", data.interactionId)
      .is("deleted_at", null)
      .maybeSingle();
    if (iErr || !interaction) throw new Error("Interaction not found");

    // Encrypt sensitive PII fields at rest
    const encryptedFields = {
      ...(data.fullName !== undefined && { full_name: encryptField(data.fullName) }),
      ...(data.contactNumber !== undefined && { contact_number: encryptField(data.contactNumber) }),
      ...(data.email !== undefined && { email: encryptField(data.email) }),
      ...(data.address !== undefined && { address: encryptField(data.address) }),
      ...(data.assignedCounsellorId !== undefined && {
        assigned_counsellor_id: data.assignedCounsellorId,
      }),
    };

    let identityId: string;

    if (interaction.identity_ref) {
      const { error: uErr } = await supabase
        .from("victim_identity")
        .update(encryptedFields)
        .eq("id", interaction.identity_ref)
        .is("deleted_at", null);
      if (uErr) throw new Error(`victim_identity update failed: ${uErr.message}`);
      identityId = interaction.identity_ref;
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from("victim_identity")
        .insert(encryptedFields)
        .select("id")
        .single();
      if (insErr || !inserted) throw new Error(`victim_identity insert failed: ${insErr?.message}`);
      identityId = inserted.id;

      await supabase
        .from("interactions")
        .update({ identity_ref: identityId })
        .eq("id", data.interactionId);
    }

    return {
      identityId,
      interactionId: data.interactionId,
      linked: true,
      encryptedAtRest: true,
    };
  });

/* ------------------------------------------------------------------ */
/* recordAssessmentOutcome — outcome feedback for threshold validation */
/* ------------------------------------------------------------------ */

const OutcomeInput = z.object({
  assessmentId: z.string().uuid(),
  initialRiskCategory: z.enum(["low", "moderate", "high", "critical"]),
  actualOutcome: z.string().min(2).max(1000),
  outcomeStatus: z.enum(["confirmed", "over_escalated", "under_escalated", "resolved"]),
  notes: z.string().max(2000).optional(),
});

export const recordAssessmentOutcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => OutcomeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roleList = (roles ?? []).map((r) => r.role as string);
    if (!roleList.includes("admin") && !roleList.includes("counsellor")) {
      throw new Error("Forbidden: only admin or counsellor roles may record assessment outcomes");
    }

    const { data: inserted, error } = await supabase
      .from("assessment_outcomes")
      .insert({
        svi_assessment_id: data.assessmentId,
        initial_risk_category: data.initialRiskCategory,
        actual_outcome: data.actualOutcome,
        outcome_status: data.outcomeStatus,
        notes: data.notes ?? null,
        reviewer_id: userId,
      })
      .select("id")
      .single();

    if (error || !inserted) throw new Error(`Failed to record outcome: ${error?.message}`);

    return { outcomeId: inserted.id, recorded: true };
  });

/* ------------------------------------------------------------------ */
/* rerunInteractionPipeline — manual/admin trigger to rerun analysis   */
/* ------------------------------------------------------------------ */

export const rerunInteractionPipeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ interactionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { rerunPipeline } = await import("./trace/pipeline.server");

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roleList = (roles ?? []).map((r) => r.role as string);
    if (!roleList.includes("admin") && !roleList.includes("counsellor")) {
      throw new Error("Forbidden: only admin or counsellor roles may trigger pipeline re-runs");
    }

    const result = await rerunPipeline(data.interactionId);
    return {
      interactionId: data.interactionId,
      status: result.isPartial ? "partial" : "complete",
      sviScore: result.svi.sviScore,
      riskCategory: result.svi.riskCategory,
      durationMs: result.durationMs,
    };
  });

/* ------------------------------------------------------------------ */
/* getSystemHealth — diagnostic status of AI gateway, DB & queues     */
/* ------------------------------------------------------------------ */

export const getSystemHealth = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let dbOk = false;
  let queueBacklog = 0;
  let outboxBacklog = 0;

  try {
    const { count: pendingCount, error: pErr } = await supabaseAdmin
      .from("interactions")
      .select("id", { count: "exact", head: true })
      .eq("pipeline_status", "pending")
      .is("deleted_at", null);

    if (!pErr) {
      dbOk = true;
      queueBacklog = pendingCount ?? 0;
    }

    const { count: outboxCount } = await supabaseAdmin
      .from("notification_outbox")
      .select("id", { count: "exact", head: true })
      .in("status", ["queued", "failed"]);

    outboxBacklog = outboxCount ?? 0;
  } catch {
    dbOk = false;
  }

  const aiGatewayConfigured = Boolean(process.env["LOVABLE_API_KEY"]);

  return {
    status: dbOk ? (aiGatewayConfigured ? "healthy" : "degraded") : "unhealthy",
    dbConnected: dbOk,
    aiGatewayConfigured,
    queueBacklog,
    outboxBacklog,
    timestamp: new Date().toISOString(),
  };
});

/* ------------------------------------------------------------------ */
/* runScheduledMaintenance — background worker / cron dispatcher      */
/* ------------------------------------------------------------------ */

export const runScheduledMaintenance = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        retentionDays: z.number().int().min(1).default(30),
        batchSize: z.number().int().min(1).max(50).default(10),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const {
      dispatchNotificationOutbox,
      processPendingInteractions,
      retryFailedPipelineRuns,
      purgeExpiredRawMedia,
    } = await import("./trace/dispatcher.server");

    const [outboxResult, queueResult, retryResult, purgedCount] = await Promise.all([
      dispatchNotificationOutbox(data.batchSize),
      processPendingInteractions(data.batchSize),
      retryFailedPipelineRuns(3, data.batchSize),
      purgeExpiredRawMedia(data.retentionDays),
    ]);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      outbox: outboxResult,
      queue: queueResult,
      retries: retryResult,
      purgedRawMediaCount: purgedCount,
    };
  });
