// compute-svi — Supabase Edge Function
// Input:  { interaction_id }
// Output: { assessment_id, svi_score, risk_category, trauma_indicators, breakdown }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_VERSION = "trace-svi-v1";
const INDICATOR_THRESHOLD = 0.4;

function clamp01(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { interaction_id } = await req.json();
    if (!interaction_id) {
      return new Response(JSON.stringify({ error: "interaction_id is required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const [{ data: signals }, { data: weights }, { data: thresholds }] = await Promise.all([
      db
        .from("stress_signals")
        .select("signal_type, value, numeric_value, confidence")
        .eq("interaction_id", interaction_id)
        .is("deleted_at", null),
      db.from("svi_weights").select("signal_type, signal_key, weight, max_contribution").eq("active", true),
      db.from("risk_thresholds").select("risk_category, min_score, max_score"),
    ]);

    if (!signals || signals.length === 0) {
      return new Response(JSON.stringify({ error: "No stress signals found for this interaction" }), {
        status: 422,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Weighted-scoring formula:
    //   contribution(signal) = normalised_value * confidence_floor * weight
    //   contribution per (signal_type, key) is capped at max_contribution
    //   svi_score = min(100, sum of all capped contributions)
    const buckets = new Map<string, { signal_type: string; key: string; sum: number }>();
    const indicatorSet = new Set<string>();

    for (const s of (signals as Array<{ signal_type: string; value: unknown; numeric_value: number | null; confidence: number | null }>)) {
      const value = (s.value ?? {}) as Record<string, unknown>;
      const key = typeof value["key"] === "string" ? value["key"] : "default";
      const normalised = clamp01(s.numeric_value ?? 0);
      const confidenceFactor = 0.5 + 0.5 * clamp01(s.confidence ?? 0.5);
      const weightRow =
        (weights as Array<{ signal_type: string; signal_key: string; weight: number; max_contribution: number }>)?.find(
          (w) => w.signal_type === s.signal_type && w.signal_key === key,
        ) ??
        (weights as Array<{ signal_type: string; signal_key: string; weight: number; max_contribution: number }>)?.find(
          (w) => w.signal_type === s.signal_type && w.signal_key === "default",
        );
      if (!weightRow) continue;

      const contribution = normalised * confidenceFactor * Number(weightRow.weight);
      const id = `${s.signal_type}:${key}`;
      const bucket = buckets.get(id) ?? { signal_type: s.signal_type, key, sum: 0 };
      bucket.sum = Math.min(bucket.sum + contribution, Number(weightRow.max_contribution));
      buckets.set(id, bucket);

      if (s.signal_type === "sentiment" && normalised >= INDICATOR_THRESHOLD) indicatorSet.add(key);
      if (s.signal_type === "keyword_flag" && typeof value["indicator"] === "string") indicatorSet.add(value["indicator"] as string);
    }

    const breakdown = [...buckets.values()].map((b) => ({
      signal_type: b.signal_type,
      key: b.key,
      contribution: Math.round(b.sum * 100) / 100,
    }));
    const sviScore = Math.round(Math.min(100, breakdown.reduce((acc, b) => acc + b.contribution, 0)) * 100) / 100;

    const threshold = (thresholds as Array<{ risk_category: string; min_score: number; max_score: number }> ?? []).find(
      (t) => sviScore >= Number(t.min_score) && sviScore <= Number(t.max_score),
    );
    const riskCategory = threshold?.risk_category ?? "low";
    const traumaIndicators = [...indicatorSet];

    const { data: inserted, error } = await db
      .from("svi_assessments")
      .insert({
        interaction_id,
        svi_score: sviScore,
        risk_category: riskCategory,
        trauma_indicators: traumaIndicators,
        model_version: MODEL_VERSION,
      })
      .select("id")
      .single();

    if (error || !inserted) throw new Error(`svi_assessments insert failed: ${error?.message}`);

    return new Response(
      JSON.stringify({
        assessment_id: (inserted as { id: string }).id,
        svi_score: sviScore,
        risk_category: riskCategory,
        trauma_indicators: traumaIndicators,
        breakdown,
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
