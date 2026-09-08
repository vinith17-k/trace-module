import { describe, it, expect } from "vitest";
import { z } from "zod";

const SubmitInputSchema = z.object({
  channel: z.enum(["voice", "chatbot", "ivrs", "webform", "app"]),
  languageCode: z.string().min(2).max(8).default("auto"),
  rawText: z.string().max(20000).optional(),
  audioUrl: z.string().url().optional(),
  consentGiven: z.boolean(),
  idempotencyKey: z.string().max(128).optional(),
  async: z.boolean().default(false),
});

const StatusLookupSchema = z.object({
  refId: z.string().min(8),
});

describe("TRACE Intake & Validation Schemas", () => {
  it("validates compliant text submissions", () => {
    const valid = {
      channel: "chatbot",
      languageCode: "mr",
      rawText: "माझ्यावर गावात अत्याचार होत आहेत",
      consentGiven: true,
    };
    const parsed = SubmitInputSchema.parse(valid);
    expect(parsed.channel).toBe("chatbot");
    expect(parsed.languageCode).toBe("mr");
    expect(parsed.consentGiven).toBe(true);
    expect(parsed.async).toBe(false);
  });

  it("validates compliant voice submissions with audioUrl", () => {
    const valid = {
      channel: "voice",
      audioUrl: "https://example.com/recordings/audio123.wav",
      consentGiven: true,
      async: true,
    };
    const parsed = SubmitInputSchema.parse(valid);
    expect(parsed.channel).toBe("voice");
    expect(parsed.audioUrl).toBe("https://example.com/recordings/audio123.wav");
    expect(parsed.async).toBe(true);
  });

  it("rejects invalid channel types", () => {
    const invalid = {
      channel: "fax",
      rawText: "Some text",
      consentGiven: true,
    };
    expect(() => SubmitInputSchema.parse(invalid)).toThrow();
  });

  it("rejects invalid audio URLs", () => {
    const invalid = {
      channel: "voice",
      audioUrl: "not-a-valid-url",
      consentGiven: true,
    };
    expect(() => SubmitInputSchema.parse(invalid)).toThrow();
  });

  it("validates reference ID lookups format", () => {
    expect(() => StatusLookupSchema.parse({ refId: "NHAA-4F82-K91" })).not.toThrow();
    expect(() => StatusLookupSchema.parse({ refId: "short" })).toThrow();
  });
});

describe("Role-Based Route Decision Logic", () => {
  function determineRoleRoute(email: string): { role: string; name: string; path: string } {
    const lower = email.toLowerCase();
    if (lower.includes("admin")) {
      return { role: "admin", name: "Dr. Ramesh Iyer", path: "/admin" };
    }
    if (lower.includes("police")) {
      return { role: "law_enforcement", name: "SI Rakesh Yadav", path: "/staff/police" };
    }
    return { role: "counsellor", name: "Priya S.", path: "/staff/queue" };
  }

  it("routes admin accounts to /admin", () => {
    const res = determineRoleRoute("r.iyer@socialjustice.gov.in (admin)");
    expect(res.role).toBe("admin");
    expect(res.path).toBe("/admin");
  });

  it("routes law enforcement accounts to /staff/police", () => {
    const res = determineRoleRoute("r.yadav@police.mh.gov.in");
    expect(res.role).toBe("law_enforcement");
    expect(res.path).toBe("/staff/police");
  });

  it("routes standard counsellor accounts to /staff/queue", () => {
    const res = determineRoleRoute("priya.s@nhaa.gov.in");
    expect(res.role).toBe("counsellor");
    expect(res.path).toBe("/staff/queue");
  });
});
