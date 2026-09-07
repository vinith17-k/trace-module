import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashReferenceId, encryptField, decryptField, checkRateLimit } from "../security.server";

// Mock Supabase admin client for pipeline tests
const mockFrom = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: mockFrom },
}));

const { computeSvi, analyzeTextSignals } = await import("../pipeline.server");
const { dispatchNotificationOutbox } = await import("../dispatcher.server");

function makeQuery(result: { data: unknown; error: null | { message: string } }) {
  const chain = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    eq: () => chain,
    in: () => chain,
    or: () => chain,
    is: () => chain,
    order: () => chain,
    limit: () => chain,
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then: (resolve: (r: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return chain;
}

describe("Security Module — Hashing & Encryption", () => {
  it("hashReferenceId generates deterministic SHA-256 hex string", () => {
    const hash1 = hashReferenceId("NHAA-4F82-K91");
    const hash2 = hashReferenceId("  nhaa-4f82-k91  "); // case and whitespace invariant
    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });

  it("hashReferenceId returns empty string for nullish or empty input", () => {
    expect(hashReferenceId("")).toBe("");
  });

  it("encryptField and decryptField roundtrip successfully", () => {
    const original = "Ramdas Kamble, Village Sonori, Pune";
    const encrypted = encryptField(original);

    expect(encrypted).not.toBeNull();
    expect(encrypted?.startsWith("enc:v1:")).toBe(true);
    expect(encrypted).not.toContain(original);

    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(original);
  });

  it("encryptField is idempotent on already-encrypted strings", () => {
    const text = "confidential-victim-phone-9820012345";
    const enc1 = encryptField(text);
    const enc2 = encryptField(enc1);
    expect(enc2).toBe(enc1);
  });

  it("decryptField returns unencrypted legacy text as-is", () => {
    const legacy = "legacy unencrypted text";
    expect(decryptField(legacy)).toBe(legacy);
    expect(decryptField(null)).toBeNull();
  });
});

describe("Rate Limiting", () => {
  it("allows requests up to the limit and then blocks", () => {
    const testKey = `test-ip-${Date.now()}`;
    const limit = 3;
    const windowMs = 5000;

    const res1 = checkRateLimit(testKey, limit, windowMs);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(testKey, limit, windowMs);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(testKey, limit, windowMs);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    const res4 = checkRateLimit(testKey, limit, windowMs);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.retryAfterSec).toBeGreaterThan(0);
  });
});

describe("Core Pipeline — Fallback & Explainability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes SVI with partial: true when fallback signals exist", async () => {
    const signals = [
      {
        signal_type: "sentiment",
        value: { key: "distress" },
        numeric_value: 0.8,
        confidence: 0,
        model_version: "fallback:keyword_only",
      },
      {
        signal_type: "keyword_flag",
        value: { key: "default", indicator: "intimidation" },
        numeric_value: 0.9,
        confidence: 0.95,
        model_version: "risk_lexicon:v1",
      },
    ];

    const weights = [
      { signal_type: "sentiment", signal_key: "distress", weight: 22, max_contribution: 22, config_version: 1 },
      { signal_type: "keyword_flag", signal_key: "default", weight: 10, max_contribution: 25, config_version: 1 },
    ];

    const thresholds = [
      { risk_category: "low", min_score: 0, max_score: 24.99, config_version: 1 },
      { risk_category: "moderate", min_score: 25, max_score: 49.99, config_version: 1 },
      { risk_category: "high", min_score: 50, max_score: 74.99, config_version: 1 },
      { risk_category: "critical", min_score: 75, max_score: 100, config_version: 1 },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "stress_signals") return makeQuery({ data: signals, error: null });
      if (table === "svi_weights") return makeQuery({ data: weights, error: null });
      if (table === "risk_thresholds") return makeQuery({ data: thresholds, error: null });
      if (table === "svi_assessments") return makeQuery({ data: { id: "mock-partial-assessment" }, error: null });
      return makeQuery({ data: null, error: null });
    });

    const result = await computeSvi("interaction-fallback-check");
    expect(result.partial).toBe(true);
    expect(result.configVersion).toContain("weights-v1:thresh-v1");
  });

  it("analyzeTextSignals still writes keyword signals even if LLM is unavailable", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "risk_lexicon") {
        return makeQuery({
          data: [
            { phrase: "kill myself", indicator: "suicidal_ideation", severity: 1.0, language_code: "en" },
            { phrase: "threatened", indicator: "intimidation", severity: 0.8, language_code: "en" },
          ],
          error: null,
        });
      }
      if (table === "stress_signals") {
        return makeQuery({ data: [], error: null });
      }
      if (table === "interactions") {
        return makeQuery({ data: {}, error: null });
      }
      return makeQuery({ data: null, error: null });
    });

    const res = await analyzeTextSignals({
      interactionId: "mock-int-fallback",
      rawText: "I am feeling threatened by the village head",
    });

    expect(res.keywordMatches.length).toBeGreaterThan(0);
    expect(res.keywordMatches[0]?.indicator).toBe("intimidation");
    expect(res.isPartial).toBe(true); // Since no LOVABLE_API_KEY in unit test env
  });
});

describe("Outbox Dispatcher", () => {
  it("dispatches queued notification records", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "notification_outbox") {
        return makeQuery({
          data: [
            {
              id: "outbox-1",
              recommendation_id: "rec-1",
              channel: "webhook",
              target: "Police Pune",
              payload: {},
              status: "queued",
              retry_count: 0,
            },
          ],
          error: null,
        });
      }
      return makeQuery({ data: null, error: null });
    });

    const result = await dispatchNotificationOutbox(5);
    expect(result.processed).toBe(1);
    expect(result.sent).toBe(1);
  });
});
