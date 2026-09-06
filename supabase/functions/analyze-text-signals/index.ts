// analyze-text-signals — Supabase Edge Function
// Input:  { interaction_id, raw_text, language_code? }
// Output: { signals_written, language_code, emotions, keyword_matches }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPPORTED_LANGUAGES = ["en", "hi", "mr", "ta", "te", "bn", "gu", "kn"] as const;

const EMOTION_KEYS = [
  "distress",
  "fear",
  "depression",
  "suicidal_ideation",
  "intimidation",
  "social_isolation",
] as const;

type EmotionKey = (typeof EMOTION_KEYS)[number];

function clamp01(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

async function callLLM(system: string, user: string): Promise<unknown | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function detectLanguage(text: string, hint?: string): Promise<string> {
  if (hint && hint !== "auto" && (SUPPORTED_LANGUAGES as readonly string[]).includes(hint)) return hint;
  const result = (await callLLM(
    `You are a language identifier. Reply with JSON only: {"language_code":"<ISO 639-1>"}. Choose from: ${SUPPORTED_LANGUAGES.join(", ")}. If unsure, use "en".`,
    text.slice(0, 2000),
  )) as { language_code?: string } | null;
  const code = result?.language_code;
  return code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code) ? code : "en";
}

const EMOTION_SYSTEM_PROMPT = `You are a triage signal extractor for a victim support helpline.
You do NOT diagnose and you never use clinical diagnosis language.
Given a caller's message in any language, rate the intensity (0.0-1.0) of observable distress cues.
Return STRICT JSON only, no prose, in exactly this shape:
{"distress":0.0,"fear":0.0,"depression":0.0,"suicidal_ideation":0.0,"intimidation":0.0,"social_isolation":0.0,"confidence":0.0,"rationale_tags":["short","cue","tags"]}
Intensity 0 means no cue present. Only report cues actually evidenced in the text.`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { interaction_id, raw_text, language_code } = await req.json();
    if (!interaction_id || !raw_text) {
      return new Response(JSON.stringify({ error: "interaction_id and raw_text are required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const languageCode = await detectLanguage(raw_text, language_code);
    const lower = (raw_text as string).toLowerCase();

    // Emotion scoring
    const llm = (await callLLM(EMOTION_SYSTEM_PROMPT, (raw_text as string).slice(0, 6000))) as
      | (Partial<Record<EmotionKey, number>> & { confidence?: number; rationale_tags?: string[] })
      | null;

    const emotions = Object.fromEntries(EMOTION_KEYS.map((k) => [k, clamp01(llm?.[k] ?? 0)])) as Record<
      EmotionKey,
      number
    >;
    const emotionConfidence = llm ? clamp01(llm.confidence ?? 0.7) : 0;

    // Keyword / lexicon flags
    const { data: lexicon } = await db
      .from("risk_lexicon")
      .select("phrase, indicator, severity, language_code")
      .eq("active", true);

    const keywordMatches = ((lexicon ?? []) as Array<{ language_code: string; phrase: string; indicator: string; severity: number }>)
      .filter(
        (row) =>
          (row.language_code === languageCode || row.language_code === "en") &&
          lower.includes(String(row.phrase).toLowerCase()),
      )
      .map((row) => ({ phrase: row.phrase, indicator: row.indicator, severity: Number(row.severity) }));

    const rows = [] as Array<Record<string, unknown>>;

    for (const key of EMOTION_KEYS) {
      rows.push({
        interaction_id,
        signal_type: "sentiment",
        value: { key, tags: llm?.rationale_tags ?? [] },
        numeric_value: emotions[key],
        confidence: emotionConfidence,
        language_code: languageCode,
      });
    }

    for (const match of keywordMatches) {
      rows.push({
        interaction_id,
        signal_type: "keyword_flag",
        value: { key: "default", phrase: match.phrase, indicator: match.indicator },
        numeric_value: clamp01(match.severity),
        confidence: 0.95,
        language_code: languageCode,
      });
    }

    const words = Math.max(1, (raw_text as string).trim().split(/\s+/).length);
    rows.push({
      interaction_id,
      signal_type: "lexical",
      value: { key: "default", matches: keywordMatches.length, words },
      numeric_value: clamp01((keywordMatches.length * 10) / words),
      confidence: 0.6,
      language_code: languageCode,
    });

    const { error } = await db.from("stress_signals").insert(rows as never);
    if (error) throw new Error(`stress_signals insert failed: ${error.message}`);

    await db.from("interactions").update({ language_code: languageCode }).eq("id", interaction_id);

    return new Response(
      JSON.stringify({ signals_written: rows.length, language_code: languageCode, emotions, keyword_matches: keywordMatches }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
