/**
 * TRACE core pipeline (server-only).
 *
 * analyze-text-signals -> analyze-voice-signals -> compute-svi
 *   -> generate-recommendation -> notify-authority
 *
 * All scoring is configuration driven: svi_weights, risk_thresholds,
 * recommendation_rules and risk_lexicon are database tables, never inline
 * magic numbers.
 */
import { getAcousticProvider, getAsrProvider } from "./providers.server";

export const MODEL_VERSION = "trace-svi-v1";
export const LLM_MODEL_NAME = "google/gemini-3.7-flash";

/** Data-driven language support: codes are only used as data, never branched on. */
export const SUPPORTED_LANGUAGES = ["en", "hi", "mr", "ta", "te", "bn", "gu", "kn"] as const;

export const EMOTION_KEYS = [
  "distress",
  "fear",
  "depression",
  "suicidal_ideation",
  "intimidation",
  "social_isolation",
] as const;
export type EmotionKey = (typeof EMOTION_KEYS)[number];

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/* ------------------------------------------------------------------ */
/* Lovable AI helper with graceful failure handling                   */
/* ------------------------------------------------------------------ */

export interface LLMResponseWithMetadata {
  data: unknown | null;
  tokensUsed?: number;
  error?: string;
}

async function callLLM(system: string, user: string): Promise<unknown | null> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) {
    console.warn("LOVABLE_API_KEY not set — falling back to deterministic keyword analysis");
    return null;
  }
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL_NAME,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      console.error("AI gateway error", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as unknown;
  } catch (e) {
    console.error("AI gateway call failed", e);
    return null;
  }
}

function clamp01(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

/* ------------------------------------------------------------------ */
/* 1. Language detection                                                */
/* ------------------------------------------------------------------ */

export async function detectLanguage(text: string, hint?: string): Promise<string> {
  if (hint && hint !== "auto" && (SUPPORTED_LANGUAGES as readonly string[]).includes(hint)) {
    return hint;
  }
  const result = (await callLLM(
    `You are a language identifier. Reply with JSON only: {"language_code":"<ISO 639-1>"}. ` +
      `Choose from: ${SUPPORTED_LANGUAGES.join(", ")}. If unsure, use "en".`,
    text.slice(0, 2000),
  )) as { language_code?: string } | null;
  const code = result?.language_code;
  return code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code) ? code : "en";
}

/* ------------------------------------------------------------------ */
/* 2. analyze-text-signals with LLM fallback                           */
/* ------------------------------------------------------------------ */

const EMOTION_SYSTEM_PROMPT = `You are a triage signal extractor for a victim support helpline.
You do NOT diagnose and you never use clinical diagnosis language.
Given a caller's message in any language, rate the intensity (0.0-1.0) of observable distress cues.
Return STRICT JSON only, no prose, in exactly this shape:
{"distress":0.0,"fear":0.0,"depression":0.0,"suicidal_ideation":0.0,"intimidation":0.0,"social_isolation":0.0,"confidence":0.0,"rationale_tags":["short","cue","tags"]}
Intensity 0 means no cue present. Only report cues actually evidenced in the text.`;

export interface TextAnalysisResult {
  interactionId: string;
  languageCode: string;
  emotions: Record<EmotionKey, number>;
  keywordMatches: Array<{ phrase: string; indicator: string; severity: number }>;
  signalsWritten: number;
  isPartial: boolean;
}

export async function analyzeTextSignals(params: {
  interactionId: string;
  rawText: string;
  languageCode?: string;
}): Promise<TextAnalysisResult> {
  const db = await admin();
  const languageCode = await detectLanguage(params.rawText, params.languageCode);
  const lower = params.rawText.toLowerCase();

  // --- Emotion / distress scoring via LLM with fallback ----------------
  const llm = (await callLLM(EMOTION_SYSTEM_PROMPT, params.rawText.slice(0, 6000))) as
    | (Partial<Record<EmotionKey, number>> & { confidence?: number; rationale_tags?: string[] })
    | null;

  const isPartial = llm === null;
  const emotions = Object.fromEntries(
    EMOTION_KEYS.map((k) => [k, clamp01(llm?.[k] ?? 0)]),
  ) as Record<EmotionKey, number>;

  // If LLM failed, confidence is 0.0, else from LLM or default 0.7
  const emotionConfidence = isPartial ? 0.0 : clamp01(llm?.confidence ?? 0.7);

  // --- Lexicon keyword flags (always executed, reliable fallback) -------
  const { data: lexicon } = await db
    .from("risk_lexicon")
    .select("phrase, indicator, severity, language_code")
    .eq("active", true);

  const keywordMatches = (lexicon ?? [])
    .filter(
      (row) =>
        (row.language_code === languageCode || row.language_code === "en") &&
        lower.includes(String(row.phrase).toLowerCase()),
    )
    .map((row) => ({
      phrase: row.phrase as string,
      indicator: row.indicator as string,
      severity: Number(row.severity),
    }));

  const rows: Array<{
    interaction_id: string;
    signal_type: "sentiment" | "keyword_flag" | "lexical";
    value: Record<string, unknown>;
    numeric_value: number;
    confidence: number;
    language_code: string;
    model_version: string;
  }> = [];

  for (const key of EMOTION_KEYS) {
    rows.push({
      interaction_id: params.interactionId,
      signal_type: "sentiment",
      value: { key, tags: llm?.rationale_tags ?? (isPartial ? ["llm_fallback"] : []) },
      numeric_value: emotions[key],
      confidence: emotionConfidence,
      language_code: languageCode,
      model_version: isPartial ? "fallback:keyword_only" : LLM_MODEL_NAME,
    });
  }

  for (const match of keywordMatches) {
    rows.push({
      interaction_id: params.interactionId,
      signal_type: "keyword_flag",
      value: { key: "default", phrase: match.phrase, indicator: match.indicator },
      numeric_value: clamp01(match.severity),
      confidence: 0.95,
      language_code: languageCode,
      model_version: "risk_lexicon:v1",
    });
  }

  // Lexical density: share of risk phrases relative to message length.
  const words = Math.max(1, params.rawText.trim().split(/\s+/).length);
  rows.push({
    interaction_id: params.interactionId,
    signal_type: "lexical",
    value: { key: "default", matches: keywordMatches.length, words },
    numeric_value: clamp01((keywordMatches.length * 10) / words),
    confidence: 0.6,
    language_code: languageCode,
    model_version: "lexical_density:v1",
  });

  const { error } = await db.from("stress_signals").insert(rows as never);
  if (error) throw new Error(`stress_signals insert failed: ${error.message}`);

  await db
    .from("interactions")
    .update({ language_code: languageCode })
    .eq("id", params.interactionId);

  return {
    interactionId: params.interactionId,
    languageCode,
    emotions,
    keywordMatches,
    signalsWritten: rows.length,
    isPartial,
  };
}

/* ------------------------------------------------------------------ */
/* 3. analyze-voice-signals                                             */
/* ------------------------------------------------------------------ */

export interface VoiceAnalysisResult {
  interactionId: string;
  transcript: string;
  languageCode: string;
  acoustic: { pitchVariance: number; pauseFrequency: number; speechRateDeviation: number };
  signalsWritten: number;
  textAnalysis: TextAnalysisResult | null;
  isPartial: boolean;
}

export async function analyzeVoiceSignals(params: {
  interactionId: string;
  audioUrl: string;
  languageCode?: string;
}): Promise<VoiceAnalysisResult> {
  const db = await admin();
  const asr = getAsrProvider();
  const acousticProvider = getAcousticProvider();

  const transcription = await asr.transcribe(params.audioUrl, params.languageCode);
  const acoustic = await acousticProvider.extract(params.audioUrl, transcription.durationSeconds);

  const rows = [
    {
      interaction_id: params.interactionId,
      signal_type: "acoustic_pitch" as const,
      value: { key: "default", provider: acousticProvider.name, metric: "pitch_variance" },
      numeric_value: clamp01(acoustic.pitchVariance),
      confidence: clamp01(acoustic.confidence),
      language_code: transcription.languageCode,
      model_version: "acoustic_pitch:v1",
    },
    {
      interaction_id: params.interactionId,
      signal_type: "acoustic_pause" as const,
      value: { key: "default", provider: acousticProvider.name, metric: "pause_frequency" },
      numeric_value: clamp01(acoustic.pauseFrequency),
      confidence: clamp01(acoustic.confidence),
      language_code: transcription.languageCode,
      model_version: "acoustic_pause:v1",
    },
    {
      interaction_id: params.interactionId,
      signal_type: "speech_rate" as const,
      value: { key: "default", provider: acousticProvider.name, metric: "speech_rate_deviation" },
      numeric_value: clamp01(acoustic.speechRateDeviation),
      confidence: clamp01(acoustic.confidence),
      language_code: transcription.languageCode,
      model_version: "speech_rate:v1",
    },
  ];

  const { error } = await db.from("stress_signals").insert(rows as never);
  if (error) throw new Error(`stress_signals insert failed: ${error.message}`);

  // Store the transcript on the interaction and run the text pipeline on it.
  await db
    .from("interactions")
    .update({ raw_text: transcription.text, language_code: transcription.languageCode })
    .eq("id", params.interactionId);

  const textAnalysis = await analyzeTextSignals({
    interactionId: params.interactionId,
    rawText: transcription.text,
    languageCode: transcription.languageCode,
  });

  return {
    interactionId: params.interactionId,
    transcript: transcription.text,
    languageCode: transcription.languageCode,
    acoustic: {
      pitchVariance: acoustic.pitchVariance,
      pauseFrequency: acoustic.pauseFrequency,
      speechRateDeviation: acoustic.speechRateDeviation,
    },
    signalsWritten: rows.length + textAnalysis.signalsWritten,
    textAnalysis,
    isPartial: textAnalysis.isPartial,
  };
}

/* ------------------------------------------------------------------ */
/* 4. compute-svi                                                       */
/* ------------------------------------------------------------------ */

export interface SviResult {
  assessmentId: string;
  interactionId: string;
  sviScore: number;
  riskCategory: "low" | "moderate" | "high" | "critical";
  traumaIndicators: string[];
  breakdown: Array<{ signal_type: string; key: string; contribution: number }>;
  partial: boolean;
  configVersion: string;
}

/** Threshold above which an emotional cue is reported as a trauma indicator. */
const INDICATOR_THRESHOLD = 0.4;

export async function computeSvi(interactionId: string, isPartial = false): Promise<SviResult> {
  const db = await admin();

  const [{ data: signals }, { data: weights }, { data: thresholds }] = await Promise.all([
    db
      .from("stress_signals")
      .select("signal_type, value, numeric_value, confidence, model_version")
      .eq("interaction_id", interactionId)
      .is("deleted_at", null),
    db
      .from("svi_weights")
      .select("signal_type, signal_key, weight, max_contribution, config_version")
      .eq("active", true),
    db.from("risk_thresholds").select("risk_category, min_score, max_score, config_version"),
  ]);

  if (!signals || signals.length === 0) {
    throw new Error("No stress signals found for this interaction");
  }

  // Derive active configuration version stamp
  const weightVersion = weights?.[0]?.config_version ?? 1;
  const threshVersion = thresholds?.[0]?.config_version ?? 1;
  const configVersion = `weights-v${weightVersion}:thresh-v${threshVersion}`;

  // Check if any sentiment signal was produced by fallback
  const hasFallbackSignal = signals.some((s) => s.model_version?.includes("fallback"));
  const finalPartial = isPartial || hasFallbackSignal;

  const buckets = new Map<string, { signal_type: string; key: string; sum: number }>();
  const indicatorSet = new Set<string>();

  for (const s of signals) {
    const value = (s.value ?? {}) as Record<string, unknown>;
    const key = typeof value["key"] === "string" ? (value["key"] as string) : "default";
    const normalised = clamp01(s.numeric_value ?? 0);
    const confidenceFactor = 0.5 + 0.5 * clamp01(s.confidence ?? 0.5);
    const weightRow =
      weights?.find((w) => w.signal_type === s.signal_type && w.signal_key === key) ??
      weights?.find((w) => w.signal_type === s.signal_type && w.signal_key === "default");
    if (!weightRow) continue;

    const contribution = normalised * confidenceFactor * Number(weightRow.weight);
    const id = `${s.signal_type}:${key}`;
    const bucket = buckets.get(id) ?? { signal_type: s.signal_type as string, key, sum: 0 };
    bucket.sum = Math.min(bucket.sum + contribution, Number(weightRow.max_contribution));
    buckets.set(id, bucket);

    if (s.signal_type === "sentiment" && normalised >= INDICATOR_THRESHOLD) {
      indicatorSet.add(key);
    }
    if (s.signal_type === "keyword_flag" && typeof value["indicator"] === "string") {
      indicatorSet.add(value["indicator"] as string);
    }
  }

  const breakdown = [...buckets.values()].map((b) => ({
    signal_type: b.signal_type,
    key: b.key,
    contribution: Math.round(b.sum * 100) / 100,
  }));
  const sviScore =
    Math.round(
      Math.min(
        100,
        breakdown.reduce((acc, b) => acc + b.contribution, 0),
      ) * 100,
    ) / 100;

  const threshold = (thresholds ?? []).find(
    (t) => sviScore >= Number(t.min_score) && sviScore <= Number(t.max_score),
  );
  const riskCategory = (threshold?.risk_category ?? "low") as SviResult["riskCategory"];
  const traumaIndicators = [...indicatorSet];

  const { data: inserted, error } = await db
    .from("svi_assessments")
    .insert({
      interaction_id: interactionId,
      svi_score: sviScore,
      risk_category: riskCategory,
      trauma_indicators: traumaIndicators,
      model_version: MODEL_VERSION,
      partial: finalPartial,
      config_version: configVersion,
    })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(`svi_assessments insert failed: ${error?.message}`);

  return {
    assessmentId: inserted.id,
    interactionId,
    sviScore,
    riskCategory,
    traumaIndicators,
    breakdown,
    partial: finalPartial,
    configVersion,
  };
}

/* ------------------------------------------------------------------ */
/* 5. generate-recommendation                                           */
/* ------------------------------------------------------------------ */

export interface RecommendationResult {
  recommendationId: string;
  actionType: string;
  priority: string;
  assignedAuthority: string | null;
  escalated: boolean;
  notified: boolean;
}

export async function generateRecommendation(
  sviAssessmentId: string,
): Promise<RecommendationResult> {
  const db = await admin();

  const { data: assessment, error: aErr } = await db
    .from("svi_assessments")
    .select("id, risk_category, trauma_indicators, interaction_id")
    .eq("id", sviAssessmentId)
    .is("deleted_at", null)
    .single();
  if (aErr || !assessment) throw new Error("Assessment not found");

  const indicators = (assessment.trauma_indicators ?? []) as string[];

  const { data: rules } = await db
    .from("recommendation_rules")
    .select("*")
    .eq("active", true)
    .order("rule_order", { ascending: true });

  const rule =
    (rules ?? []).find(
      (r) =>
        r.risk_category === assessment.risk_category &&
        (r.required_indicator === null || indicators.includes(r.required_indicator)),
    ) ?? null;

  const actionType = (rule?.action_type ?? "counselling") as string;
  const priority = (rule?.priority ?? "routine") as string;

  const { data: rec, error: rErr } = await db
    .from("recommendations")
    .insert({
      svi_assessment_id: sviAssessmentId,
      action_type: actionType as never,
      priority: priority as never,
      assigned_authority: rule?.assigned_authority ?? null,
      status: "pending",
    })
    .select("id")
    .single();
  if (rErr || !rec) throw new Error(`recommendations insert failed: ${rErr?.message}`);

  const criticalEscalation =
    assessment.risk_category === "critical" &&
    (indicators.includes("suicidal_ideation") || indicators.includes("intimidation"));
  const escalate = Boolean(rule?.auto_escalate) || criticalEscalation || priority === "immediate";

  let notified = false;
  if (escalate) {
    await db.from("escalation_log").insert({
      recommendation_id: rec.id,
      actor: "system:generate-recommendation",
      action_taken: "auto_escalated",
      notes: `risk=${assessment.risk_category}; indicators=${indicators.join(",") || "none"}`,
    });
  }

  if (
    priority === "immediate" ||
    actionType === "police_intervention" ||
    actionType === "witness_protection"
  ) {
    await notifyAuthority(rec.id);
    notified = true;
  }

  return {
    recommendationId: rec.id,
    actionType,
    priority,
    assignedAuthority: rule?.assigned_authority ?? null,
    escalated: escalate,
    notified,
  };
}

/* ------------------------------------------------------------------ */
/* 6. notify-authority                                                  */
/* ------------------------------------------------------------------ */

export async function notifyAuthority(recommendationId: string): Promise<{ outboxId: string }> {
  const db = await admin();

  const { data: rec, error } = await db
    .from("recommendations")
    .select("id, action_type, priority, assigned_authority, svi_assessment_id")
    .eq("id", recommendationId)
    .is("deleted_at", null)
    .single();
  if (error || !rec) throw new Error("Recommendation not found");

  const payload = {
    recommendation_id: rec.id,
    action_type: rec.action_type,
    priority: rec.priority,
    assigned_authority: rec.assigned_authority,
    dispatched_by: "trace-notify-authority",
  };

  const { data: outbox, error: oErr } = await db
    .from("notification_outbox")
    .insert({
      recommendation_id: rec.id,
      channel: "webhook",
      target: rec.assigned_authority,
      payload,
      status: "queued",
      retry_count: 0,
    })
    .select("id")
    .single();
  if (oErr || !outbox) throw new Error(`notification_outbox insert failed: ${oErr?.message}`);

  await db
    .from("recommendations")
    .update({ status: "dispatched", dispatched_at: new Date().toISOString() })
    .eq("id", rec.id);

  await db.from("escalation_log").insert({
    recommendation_id: rec.id,
    actor: "system:notify-authority",
    action_taken: "notification_queued",
    notes: `channel=webhook; target=${rec.assigned_authority ?? "unassigned"}`,
  });

  return { outboxId: outbox.id };
}

/* ------------------------------------------------------------------ */
/* 7. End-to-End Pipeline Runner & Re-run (with Telemetry)             */
/* ------------------------------------------------------------------ */

export interface FullPipelineResult {
  interactionId: string;
  svi: SviResult;
  recommendation: RecommendationResult;
  isPartial: boolean;
  durationMs: number;
}

/**
 * Executes the entire TRACE analysis pipeline for an interaction with
 * telemetry logging into pipeline_runs and status updating on interactions.
 */
export async function runFullPipeline(
  interactionId: string,
  options?: { isRerun?: boolean },
): Promise<FullPipelineResult> {
  const db = await admin();
  const startTime = Date.now();

  const { data: interaction, error: iErr } = await db
    .from("interactions")
    .select("id, channel, raw_text, audio_url, language_code, consent_given, pipeline_attempts")
    .eq("id", interactionId)
    .is("deleted_at", null)
    .single();

  if (iErr || !interaction) {
    throw new Error(`Interaction ${interactionId} not found or deleted`);
  }

  if (!interaction.consent_given) {
    throw new Error("Consent not given; cannot run analysis pipeline");
  }

  // Update interaction to 'analyzing' and increment attempts
  const currentAttempts = (interaction.pipeline_attempts ?? 0) + 1;
  await db
    .from("interactions")
    .update({
      pipeline_status: "analyzing",
      pipeline_attempts: currentAttempts,
      last_error: null,
    })
    .eq("id", interactionId);

  // Insert initial telemetry run record
  let runId: string | undefined;
  try {
    const { data: runRecord } = await db
      .from("pipeline_runs")
      .insert({
        interaction_id: interactionId,
        started_at: new Date().toISOString(),
        model_name: LLM_MODEL_NAME,
        status: "started",
      })
      .select("id")
      .single();
    runId = runRecord?.id;
  } catch {
    // Gracefully continue if pipeline_runs table is optional or logging fails
  }

  try {
    let isPartial = false;
    if (interaction.audio_url) {
      const voiceResult = await analyzeVoiceSignals({
        interactionId,
        audioUrl: interaction.audio_url,
        languageCode: interaction.language_code,
      });
      isPartial = voiceResult.isPartial;
    } else if (interaction.raw_text) {
      const textResult = await analyzeTextSignals({
        interactionId,
        rawText: interaction.raw_text,
        languageCode: interaction.language_code,
      });
      isPartial = textResult.isPartial;
    } else {
      throw new Error("No raw text or audio available for analysis");
    }

    const svi = await computeSvi(interactionId, isPartial);
    const recommendation = await generateRecommendation(svi.assessmentId);

    const durationMs = Date.now() - startTime;
    const finalStatus = isPartial ? "partial" : "complete";

    // Mark interaction complete or partial
    await db
      .from("interactions")
      .update({
        pipeline_status: finalStatus,
        last_error: null,
      })
      .eq("id", interactionId);

    // Update telemetry run
    if (runId) {
      await db
        .from("pipeline_runs")
        .update({
          completed_at: new Date().toISOString(),
          duration_ms: durationMs,
          status: isPartial ? "partial" : "success",
        })
        .eq("id", runId);
    }

    return {
      interactionId,
      svi,
      recommendation,
      isPartial,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Update interaction status to failed
    await db
      .from("interactions")
      .update({
        pipeline_status: "failed",
        last_error: errorMsg,
      })
      .eq("id", interactionId);

    // Update telemetry run with error
    if (runId) {
      await db
        .from("pipeline_runs")
        .update({
          completed_at: new Date().toISOString(),
          duration_ms: durationMs,
          status: "failed",
          error_message: errorMsg,
        })
        .eq("id", runId);
    }

    throw err;
  }
}

/**
 * Re-runs the pipeline for an interaction, soft-deleting any previous
 * signals and assessments to guarantee clean re-assessment.
 */
export async function rerunPipeline(interactionId: string): Promise<FullPipelineResult> {
  const db = await admin();
  const now = new Date().toISOString();

  // Soft-delete previous signals and assessments
  await Promise.all([
    db
      .from("stress_signals")
      .update({ deleted_at: now })
      .eq("interaction_id", interactionId)
      .is("deleted_at", null),
    db
      .from("svi_assessments")
      .update({ deleted_at: now })
      .eq("interaction_id", interactionId)
      .is("deleted_at", null),
  ]);

  return runFullPipeline(interactionId, { isRerun: true });
}
