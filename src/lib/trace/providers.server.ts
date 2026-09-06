/**
 * Pluggable provider interfaces for TRACE.
 *
 * ASR (speech-to-text) and acoustic feature extraction are intentionally
 * behind interfaces so a real vendor (Google STT, Azure, Bhashini, Whisper,
 * openSMILE, praat-parselmouth, ...) can be dropped in without touching the
 * pipeline, DB writes, or scoring code.
 *
 * The mock implementations below return deterministic values derived from the
 * audio URL so the end-to-end pipeline is fully exercisable today.
 */

export interface TranscriptionResult {
  text: string;
  languageCode: string;
  /** 0-1 provider confidence in the transcript */
  confidence: number;
  durationSeconds: number;
}

export interface AsrProvider {
  readonly name: string;
  transcribe(audioUrl: string, languageHint?: string): Promise<TranscriptionResult>;
}

/** All values normalised to 0-1 where 1 = maximal stress indication. */
export interface AcousticFeatures {
  pitchVariance: number;
  pauseFrequency: number;
  speechRateDeviation: number;
  /** 0-1 confidence of the extractor */
  confidence: number;
}

export interface AcousticProvider {
  readonly name: string;
  extract(audioUrl: string, durationSeconds?: number): Promise<AcousticFeatures>;
}

/** Deterministic pseudo-random 0-1 from a string, so mocks are stable per input. */
function seeded(input: string, salt: string): number {
  let h = 2166136261;
  const s = `${salt}:${input}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 1000) / 1000;
}

// TODO: replace with a real ASR vendor client (keep the same interface).
export const mockAsrProvider: AsrProvider = {
  name: "mock-asr",
  async transcribe(audioUrl, languageHint) {
    return {
      text: `[mock transcript for ${audioUrl}] The caller reports fear and says they were threatened and cannot sleep.`,
      languageCode: languageHint && languageHint !== "auto" ? languageHint : "en",
      confidence: 0.55,
      durationSeconds: 30 + Math.round(seeded(audioUrl, "dur") * 120),
    };
  },
};

// TODO: replace with a real acoustic feature extractor (keep the same interface).
export const mockAcousticProvider: AcousticProvider = {
  name: "mock-acoustic",
  async extract(audioUrl) {
    return {
      pitchVariance: seeded(audioUrl, "pitch"),
      pauseFrequency: seeded(audioUrl, "pause"),
      speechRateDeviation: seeded(audioUrl, "rate"),
      confidence: 0.5,
    };
  },
};

export function getAsrProvider(): AsrProvider {
  return mockAsrProvider;
}

export function getAcousticProvider(): AcousticProvider {
  return mockAcousticProvider;
}
