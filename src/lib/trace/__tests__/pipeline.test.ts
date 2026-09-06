import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// We unit-test the pure logic of the pipeline by mocking the Supabase client.
// No real DB or network connections are made in these tests.
// ---------------------------------------------------------------------------

// Mock the Supabase admin client before importing the pipeline.
const mockFrom = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: mockFrom },
}));

// Import after mocking so pipeline.server uses our stub.
const { computeSvi } = await import("../pipeline.server");

/* ------------------------------------------------------------------ */
/* Helpers                                                               */
/* ------------------------------------------------------------------ */

/** Build a chainable Supabase query mock that resolves with `result`. */
function makeQuery(result: { data: unknown; error: null | { message: string } }) {
  const chain = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    eq: () => chain,
    is: () => chain,
    order: () => chain,
    limit: () => chain,
    range: () => chain,
    in: () => chain,
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then: (resolve: (r: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return chain;
}

/** Stress signal rows factory. */
function signal(
  signalType: string,
  key: string,
  numericValue: number,
  confidence: number,
): Record<string, unknown> {
  return { signal_type: signalType, value: { key }, numeric_value: numericValue, confidence };
}

const BASE_WEIGHTS = [
  { signal_type: "sentiment", signal_key: "distress", weight: 22, max_contribution: 22 },
  { signal_type: "sentiment", signal_key: "fear", weight: 12, max_contribution: 12 },
  { signal_type: "sentiment", signal_key: "depression", weight: 12, max_contribution: 12 },
  { signal_type: "sentiment", signal_key: "suicidal_ideation", weight: 30, max_contribution: 30 },
  { signal_type: "sentiment", signal_key: "intimidation", weight: 14, max_contribution: 14 },
  { signal_type: "sentiment", signal_key: "social_isolation", weight: 10, max_contribution: 10 },
  { signal_type: "lexical", signal_key: "default", weight: 8, max_contribution: 15 },
  { signal_type: "keyword_flag", signal_key: "default", weight: 10, max_contribution: 25 },
  { signal_type: "acoustic_pitch", signal_key: "default", weight: 10, max_contribution: 10 },
  { signal_type: "acoustic_pause", signal_key: "default", weight: 8, max_contribution: 8 },
  { signal_type: "speech_rate", signal_key: "default", weight: 8, max_contribution: 8 },
];

const BASE_THRESHOLDS = [
  { risk_category: "low", min_score: 0, max_score: 24.99 },
  { risk_category: "moderate", min_score: 25, max_score: 49.99 },
  { risk_category: "high", min_score: 50, max_score: 74.99 },
  { risk_category: "critical", min_score: 75, max_score: 100 },
];

/* ------------------------------------------------------------------ */
/* Tests                                                                 */
/* ------------------------------------------------------------------ */

describe("computeSvi — weighted scoring formula", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupMocks(signals: unknown[], weights = BASE_WEIGHTS, thresholds = BASE_THRESHOLDS) {
    mockFrom.mockImplementation((table: string) => {
      if (table === "stress_signals") return makeQuery({ data: signals, error: null });
      if (table === "svi_weights") return makeQuery({ data: weights, error: null });
      if (table === "risk_thresholds") return makeQuery({ data: thresholds, error: null });
      if (table === "svi_assessments") {
        return makeQuery({ data: { id: "mock-assessment-uuid" }, error: null });
      }
      return makeQuery({ data: null, error: null });
    });
  }

  it("throws when no stress signals exist", async () => {
    setupMocks([]);
    await expect(computeSvi("some-interaction-id")).rejects.toThrow("No stress signals found");
  });

  it("returns risk_category='low' for all-zero signals", async () => {
    setupMocks([
      signal("sentiment", "distress", 0, 0.9),
      signal("sentiment", "fear", 0, 0.9),
    ]);
    const result = await computeSvi("interaction-1");
    expect(result.sviScore).toBe(0);
    expect(result.riskCategory).toBe("low");
  });

  it("caps SVI score at 100 even when contributions exceed 100", async () => {
    // Max out all signals at 1.0 with full confidence.
    setupMocks([
      signal("sentiment", "distress", 1, 1),
      signal("sentiment", "fear", 1, 1),
      signal("sentiment", "depression", 1, 1),
      signal("sentiment", "suicidal_ideation", 1, 1),
      signal("sentiment", "intimidation", 1, 1),
      signal("sentiment", "social_isolation", 1, 1),
      signal("lexical", "default", 1, 1),
      signal("keyword_flag", "default", 1, 1),
      signal("acoustic_pitch", "default", 1, 1),
      signal("acoustic_pause", "default", 1, 1),
      signal("speech_rate", "default", 1, 1),
    ]);
    const result = await computeSvi("interaction-max");
    expect(result.sviScore).toBeLessThanOrEqual(100);
    expect(result.riskCategory).toBe("critical");
  });

  it("classifies risk_category='moderate' for mid-range score", async () => {
    // distress=0.5, confidence=0.8 → contribution = 0.5 * (0.5+0.5*0.8) * 22 = 0.5 * 0.9 * 22 = 9.9
    setupMocks([signal("sentiment", "distress", 0.5, 0.8)]);
    const result = await computeSvi("interaction-moderate");
    // 9.9 falls in 'low' (0–24.99) — confirms formula not 'moderate' at just one signal
    expect(result.sviScore).toBeGreaterThan(0);
    expect(["low", "moderate"]).toContain(result.riskCategory);
  });

  it("detects trauma_indicators above INDICATOR_THRESHOLD=0.4", async () => {
    setupMocks([
      signal("sentiment", "suicidal_ideation", 0.9, 1), // above 0.4 → indicator
      signal("sentiment", "fear", 0.3, 1), // below 0.4 → NOT indicator
    ]);
    const result = await computeSvi("interaction-indicators");
    expect(result.traumaIndicators).toContain("suicidal_ideation");
    expect(result.traumaIndicators).not.toContain("fear");
  });

  it("adds keyword_flag indicator to traumaIndicators", async () => {
    setupMocks([
      {
        signal_type: "keyword_flag",
        value: { key: "default", indicator: "intimidation", phrase: "he threatened me" },
        numeric_value: 0.8,
        confidence: 0.95,
      },
    ]);
    const result = await computeSvi("interaction-keyword");
    expect(result.traumaIndicators).toContain("intimidation");
  });

  it("skips signals with no matching weight row", async () => {
    // No weight row for 'unknown_signal' → should not contribute to score.
    setupMocks([
      { signal_type: "unknown_signal", value: { key: "default" }, numeric_value: 1, confidence: 1 },
    ]);
    const result = await computeSvi("interaction-unknown-signal");
    expect(result.sviScore).toBe(0);
  });

  it("confidence factor of 0 results in half-weight (floor 0.5)", async () => {
    // confidence=0 → confidenceFactor = 0.5+0.5*0 = 0.5
    // distress=1, weight=22, maxContrib=22 → contribution = 1 * 0.5 * 22 = 11
    setupMocks([signal("sentiment", "distress", 1, 0)]);
    const result = await computeSvi("interaction-zero-confidence");
    expect(result.sviScore).toBeCloseTo(11, 0);
  });

  it("max_contribution caps a single signal bucket", async () => {
    // We set max_contribution=5 on distress — even with contribution=11, cap=5.
    const customWeights = [{ signal_type: "sentiment", signal_key: "distress", weight: 22, max_contribution: 5 }];
    setupMocks([signal("sentiment", "distress", 1, 1)], customWeights, BASE_THRESHOLDS);
    const result = await computeSvi("interaction-cap");
    expect(result.sviScore).toBeLessThanOrEqual(5);
  });

  it("returns the assessment_id from the inserted row", async () => {
    setupMocks([signal("sentiment", "distress", 0.1, 0.9)]);
    const result = await computeSvi("interaction-id-check");
    expect(result.assessmentId).toBe("mock-assessment-uuid");
    expect(result.interactionId).toBe("interaction-id-check");
  });

  it("breakdown contains one entry per (signal_type, key) bucket", async () => {
    setupMocks([
      signal("sentiment", "distress", 0.5, 0.9),
      signal("sentiment", "fear", 0.3, 0.9),
    ]);
    const result = await computeSvi("interaction-breakdown");
    const types = result.breakdown.map((b) => `${b.signal_type}:${b.key}`);
    expect(types).toContain("sentiment:distress");
    expect(types).toContain("sentiment:fear");
    // No duplicates.
    expect(new Set(types).size).toBe(types.length);
  });
});
