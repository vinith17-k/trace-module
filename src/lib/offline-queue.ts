/**
 * Client-side holding pen for SOS intakes captured while the device is offline.
 *
 * Note: the Supabase JS client has no built-in offline write queue, so captures
 * are held in the browser's own storage until connectivity returns; the sync
 * path then writes them to `offline_queue` server-side (anon has no read access).
 */
const KEY = "trace_offline_queue";

export interface OfflineCapture {
  clientRef: string;
  channel: "voice" | "chatbot" | "ivrs" | "webform" | "app";
  languageCode: string;
  rawText: string;
  consentGiven: boolean;
  capturedAt: string;
  gpsLat: number | null;
  gpsLng: number | null;
}

export function readQueue(): OfflineCapture[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OfflineCapture[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: OfflineCapture[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function enqueueCapture(item: OfflineCapture) {
  writeQueue([...readQueue(), item]);
}

export function removeCapture(clientRef: string) {
  writeQueue(readQueue().filter((i) => i.clientRef !== clientRef));
}

/** Device GPS chip only — works with no data connection. */
export function capturePosition(timeoutMs = 8000): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    );
  });
}
