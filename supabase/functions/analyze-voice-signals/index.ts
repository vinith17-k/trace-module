// analyze-voice-signals — Supabase Edge Function
// Input:  { interaction_id, audio_url, language_code? }
// Output: { signals_written, transcript, language_code, acoustic }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function clamp01(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

/** Deterministic pseudo-random 0-1 from a string (for mock stability). */
function seeded(input: string, salt: string): number {
  let h = 2166136261;
  const s = `${salt}:${input}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 1000) / 1000;
}

// ---------------------------------------------------------------------------
// TODO: Replace with a real ASR vendor (Google STT / Azure / Bhashini / Whisper).
//       Keep the same interface: { text, languageCode, confidence, durationSeconds }
// ---------------------------------------------------------------------------
async function transcribe(audioUrl: string, languageHint?: string) {
  return {
    text: `[mock transcript for ${audioUrl}] The caller reports fear and says they were threatened and cannot sleep.`,
    languageCode: languageHint && languageHint !== "auto" ? languageHint : "en",
    confidence: 0.55,
    durationSeconds: 30 + Math.round(seeded(audioUrl, "dur") * 120),
  };
}

// ---------------------------------------------------------------------------
// TODO: Replace with a real acoustic feature extractor (openSMILE / praat-parselmouth).
//       Keep the same interface: { pitchVariance, pauseFrequency, speechRateDeviation, confidence }
// ---------------------------------------------------------------------------
async function extractAcoustic(audioUrl: string) {
  return {
    pitchVariance: seeded(audioUrl, "pitch"),
    pauseFrequency: seeded(audioUrl, "pause"),
    speechRateDeviation: seeded(audioUrl, "rate"),
    confidence: 0.5,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { interaction_id, audio_url, language_code } = await req.json();
    if (!interaction_id || !audio_url) {
      return new Response(JSON.stringify({ error: "interaction_id and audio_url are required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const transcription = await transcribe(audio_url, language_code);
    const acoustic = await extractAcoustic(audio_url);

    const rows = [
      {
        interaction_id,
        signal_type: "acoustic_pitch",
        value: { key: "default", provider: "mock-acoustic", metric: "pitch_variance" },
        numeric_value: clamp01(acoustic.pitchVariance),
        confidence: clamp01(acoustic.confidence),
        language_code: transcription.languageCode,
      },
      {
        interaction_id,
        signal_type: "acoustic_pause",
        value: { key: "default", provider: "mock-acoustic", metric: "pause_frequency" },
        numeric_value: clamp01(acoustic.pauseFrequency),
        confidence: clamp01(acoustic.confidence),
        language_code: transcription.languageCode,
      },
      {
        interaction_id,
        signal_type: "speech_rate",
        value: { key: "default", provider: "mock-acoustic", metric: "speech_rate_deviation" },
        numeric_value: clamp01(acoustic.speechRateDeviation),
        confidence: clamp01(acoustic.confidence),
        language_code: transcription.languageCode,
      },
    ];

    const { error } = await db.from("stress_signals").insert(rows as never);
    if (error) throw new Error(`stress_signals insert failed: ${error.message}`);

    // Store transcript on the interaction, then chain text analysis.
    await db
      .from("interactions")
      .update({ raw_text: transcription.text, language_code: transcription.languageCode })
      .eq("id", interaction_id);

    // Call analyze-text-signals edge function to process the transcript.
    const fnUrl = `${supabaseUrl}/functions/v1/analyze-text-signals`;
    await fetch(fnUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({
        interaction_id,
        raw_text: transcription.text,
        language_code: transcription.languageCode,
      }),
    });

    return new Response(
      JSON.stringify({
        signals_written: rows.length,
        transcript: transcription.text,
        language_code: transcription.languageCode,
        acoustic: {
          pitch_variance: acoustic.pitchVariance,
          pause_frequency: acoustic.pauseFrequency,
          speech_rate_deviation: acoustic.speechRateDeviation,
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
