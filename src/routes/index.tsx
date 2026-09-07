import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { submitInteraction, getStatusByRef } from "@/lib/trace.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRACE — Stress & Trauma Assessment Test Console" },
      {
        name: "description",
        content:
          "Minimal test console for the TRACE helpline pipeline: submit text or voice, view SVI score, risk category and recommended action.",
      },
      { property: "og:title", content: "TRACE — Stress & Trauma Assessment Test Console" },
      {
        property: "og:description",
        content:
          "Submit a helpline interaction and inspect the resulting stress vulnerability index, risk category and escalation recommendation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type SubmitResult = Awaited<ReturnType<typeof submitInteraction>>;
type StatusResult = Awaited<ReturnType<typeof getStatusByRef>>;

function Index() {
  const submit = useServerFn(submitInteraction);
  const lookup = useServerFn(getStatusByRef);

  const [channel, setChannel] = useState("webform");
  const [languageCode, setLanguageCode] = useState("auto");
  const [rawText, setRawText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [consentGiven, setConsentGiven] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const [refId, setRefId] = useState("");
  const [status, setStatus] = useState<StatusResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await submit({
        data: {
          channel: channel as "voice" | "chatbot" | "ivrs" | "webform" | "app",
          languageCode,
          rawText: rawText.trim() ? rawText : undefined,
          audioUrl: audioUrl.trim() ? audioUrl : undefined,
          consentGiven,
        },
      });
      setResult(res);
      setRefId(res.anonymizedRefId ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onLookup() {
    setError(null);
    try {
      setStatus(await lookup({ data: { refId } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6 text-foreground">
      <h1 className="text-2xl font-semibold">TRACE test console</h1>

      <form onSubmit={onSubmit} className="space-y-3 rounded border p-4">
        <div className="flex gap-3">
          <label className="flex-1">
            Channel
            <select
              className="w-full border p-1"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              {["voice", "chatbot", "ivrs", "webform", "app"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1">
            Language
            <select
              className="w-full border p-1"
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
            >
              {["auto", "en", "hi", "mr", "ta", "te", "bn", "gu", "kn"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          Text
          <textarea
            className="w-full border p-1"
            rows={4}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="What the caller said…"
          />
        </label>

        <label className="block">
          Audio URL (optional)
          <input
            className="w-full border p-1"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="https://…/call.wav"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
          />
          Consent given for analysis
        </label>

        <button type="submit" disabled={busy} className="border px-3 py-1">
          {busy ? "Analysing…" : "Submit interaction"}
        </button>
      </form>

      {error && <p className="rounded border border-destructive p-3 text-sm">{error}</p>}

      {result && (
        <section className="space-y-2 rounded border p-4">
          <h2 className="font-semibold">Result</h2>
          <p>Reference id: {result.anonymizedRefId}</p>
          {result.consentPending ? (
            <p>Consent pending — interaction stored, no analysis performed.</p>
          ) : (
            <ul className="space-y-1">
              <li>SVI score: {result.analysis?.sviScore}</li>
              <li>Risk category: {result.analysis?.riskCategory}</li>
              <li>Trauma indicators: {(result.analysis?.traumaIndicators ?? []).join(", ") || "none"}</li>
              <li>Action: {result.analysis?.actionType}</li>
              <li>Priority: {result.analysis?.priority}</li>
              <li>Authority: {result.analysis?.assignedAuthority ?? "unassigned"}</li>
              <li>Escalated: {String(result.analysis?.escalated)}</li>
              <li>Authority notified: {String(result.analysis?.notified)}</li>
            </ul>
          )}
          <pre className="overflow-auto border p-2 text-xs">
            {JSON.stringify(result.analysis?.breakdown ?? [], null, 2)}
          </pre>
        </section>
      )}

      <section className="space-y-2 rounded border p-4">
        <h2 className="font-semibold">Status lookup by reference id</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 border p-1"
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
            placeholder="anonymised reference id"
          />
          <button type="button" onClick={onLookup} className="border px-3 py-1">
            Look up
          </button>
        </div>
        {status !== null && (
          <pre className="overflow-auto border p-2 text-xs">{JSON.stringify(status, null, 2)}</pre>
        )}
      </section>
    </main>
  );
}
