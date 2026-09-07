/**
 * TRACE Security, Cryptography & Rate Limiting Module (server-only).
 *
 * Provides:
 *  - Reference ID hashing (SHA-256) for non-reversible reference storage & lookups.
 *  - At-rest field-level encryption for sensitive PII in victim_identity (AES-256-GCM).
 *  - Sliding-window rate-limiting to prevent automated brute-forcing or submission flooding.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/* ------------------------------------------------------------------ */
/* 1. Reference ID Hashing                                             */
/* ------------------------------------------------------------------ */

/**
 * Computes a standardized SHA-256 hex hash of an anonymized reference ID.
 * Input is trimmed and uppercase-normalized to ensure case-insensitive matching.
 */
export function hashReferenceId(refId: string): string {
  if (!refId) return "";
  const normalized = refId.trim().toUpperCase();
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

/* ------------------------------------------------------------------ */
/* 2. At-Rest PII Field Encryption (AES-256-GCM)                      */
/* ------------------------------------------------------------------ */

const ENCRYPTION_PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Retrieves the 32-byte key used for field encryption.
 * Reads ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY derived hash as safe fallback.
 */
function getEncryptionKey(): Buffer {
  const customKey = process.env["ENCRYPTION_KEY"] || process.env["TRACE_PII_ENCRYPTION_KEY"];
  if (customKey) {
    return createHash("sha256").update(customKey, "utf8").digest();
  }

  const fallbackSecret = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "trace-dev-pii-default-secret-salt-2026";
  return createHash("sha256").update(`pii-encryption:${fallbackSecret}`, "utf8").digest();
}

/**
 * Encrypts a sensitive string using AES-256-GCM.
 * Output format: "enc:v1:<base64(iv + authTag + ciphertext)>"
 */
export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext === null || plaintext === undefined || plaintext === "") {
    return null;
  }
  // Idempotent: if already encrypted, return as is
  if (plaintext.startsWith(ENCRYPTION_PREFIX)) {
    return plaintext;
  }

  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Payload: IV (12B) + AuthTag (16B) + Ciphertext
    const payload = Buffer.concat([iv, authTag, ciphertext]);
    return `${ENCRYPTION_PREFIX}${payload.toString("base64")}`;
  } catch (err) {
    console.error("Field encryption failed:", err);
    throw new Error("Security exception: PII encryption failure");
  }
}

/**
 * Decrypts an AES-256-GCM encrypted field.
 * If the string does not have the "enc:v1:" prefix, returns it as-is (for backwards compatibility).
 */
export function decryptField(encryptedText: string | null | undefined): string | null {
  if (encryptedText === null || encryptedText === undefined || encryptedText === "") {
    return null;
  }
  if (!encryptedText.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedText; // Unencrypted legacy plaintext
  }

  try {
    const key = getEncryptionKey();
    const rawBase64 = encryptedText.slice(ENCRYPTION_PREFIX.length);
    const payload = Buffer.from(rawBase64, "base64");

    if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error("Corrupted encrypted payload length");
    }

    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("Field decryption failed:", err);
    return "[DECRYPTION_ERROR]";
  }
}

/* ------------------------------------------------------------------ */
/* 3. Sliding Window Rate Limiting                                    */
/* ------------------------------------------------------------------ */

interface RateLimitBucket {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitBucket>();

// Periodic cleanup of stale buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  const maxWindow = 10 * 60 * 1000;
  for (const [key, bucket] of rateLimitStore.entries()) {
    bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < maxWindow);
    if (bucket.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

/**
 * Sliding-window rate-limiter.
 *
 * @param key unique identifier (e.g. IP + endpoint)
 * @param limit maximum allowed requests within window
 * @param windowMs window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let bucket = rateLimitStore.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    rateLimitStore.set(key, bucket);
  }

  // Filter timestamps within current window
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
    };
  }

  bucket.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - bucket.timestamps.length,
  };
}

/** Rate limits anonymous intake submissions: max 10 requests per minute per IP */
export function checkSubmitRateLimit(ipOrIdentifier: string) {
  return checkRateLimit(`submit:${ipOrIdentifier}`, 10, 60 * 1000);
}

/** Rate limits status lookups: max 15 requests per minute per IP to mitigate brute force */
export function checkStatusLookupRateLimit(ipOrIdentifier: string) {
  return checkRateLimit(`status_lookup:${ipOrIdentifier}`, 15, 60 * 1000);
}
