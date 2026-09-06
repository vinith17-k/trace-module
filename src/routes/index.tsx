import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { submitInteraction, getStatusByRef, getCaseDashboard } from "@/lib/trace.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/")(
  {
    component: TracePage,
  }
);

/* ------------------------------------------------------------------ */
/* Types                                                                 */
/* ------------------------------------------------------------------ */

type Channel = "voice" | "chatbot" | "ivrs" | "webform" | "app";
type LanguageCode = "auto" | "en" | "hi" | "mr" | "ta" | "te" | "bn" | "gu" | "kn";

type AnalysisResult = {
  sviScore: number;
  riskCategory: "low" | "moderate" | "high" | "critical";
  traumaIndicators: string[];
  breakdown: Array<{ signal_type: string; key: string; contribution: number }>;
  actionType: string;
  priority: string;
  assignedAuthority: string | null;
  escalated: boolean;
  notified: boolean;
};

type SubmitResponse = {
  interactionId: string;
  anonymizedRefId: string;
  consentPending: boolean;
  analysis: AnalysisResult | null;
};

type StatusResponse = {
  consentPending: boolean;
  createdAt: string;
  sviScore: number | null;
  riskCategory: string | null;
  traumaIndicators: unknown[];
  recommendation: { action_type: string; priority: string; status: string } | null;
} | null;

/* ------------------------------------------------------------------ */
/* Helpers                                                               */
/* ------------------------------------------------------------------ */

function riskColor(category: string) {
  switch (category) {
    case "critical": return "bg-red-600 text-white";
    case "high": return "bg-orange-500 text-white";
    case "moderate": return "bg-yellow-500 text-black";
    default: return "bg-green-500 text-white";
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case "immediate": return "destructive" as const;
    case "urgent": return "secondary" as const;
    default: return "outline" as const;
  }
}

function actionLabel(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function sviGaugeColor(score: number) {
  if (score >= 75) return "bg-red-500";
  if (score >= 50) return "bg-orange-400";
  if (score >= 25) return "bg-yellow-400";
  return "bg-green-500";
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                        */
/* ------------------------------------------------------------------ */

function SviGauge({ score, category }: { score: number; category: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">SVI Score</span>
        <span className="text-3xl font-bold tabular-nums">{score.toFixed(1)}</span>
      </div>
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${sviGaugeColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Risk Category:</span>
        <span className={`rounded-full px-3 py-0.5 text-sm font-semibold capitalize ${riskColor(category)}`}>
          {category}
        </span>
      </div>
    </div>
  );
}

function TraumaChips({ indicators }: { indicators: string[] }) {
  if (!indicators.length) {
    return <p className="text-sm text-muted-foreground italic">No trauma indicators detected above threshold.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {indicators.map((ind) => (
        <Badge key={ind} variant="secondary" className="capitalize">
          {ind.replace(/_/g, " ")}
        </Badge>
      ))}
    </div>
  );
}

function BreakdownTable({ breakdown }: { breakdown: AnalysisResult["breakdown"] }) {
  if (!breakdown.length) return null;
  const sorted = [...breakdown].sort((a, b) => b.contribution - a.contribution);
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Signal Type</th>
            <th className="px-3 py-2 text-left font-medium">Key</th>
            <th className="px-3 py-2 text-right font-medium">Contribution</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-1.5 capitalize">{row.signal_type.replace(/_/g, " ")}</td>
              <td className="px-3 py-1.5 capitalize text-muted-foreground">{row.key.replace(/_/g, " ")}</td>
              <td className="px-3 py-1.5 text-right font-mono">{row.contribution.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultsPanel({ result }: { result: SubmitResponse }) {
  if (result.consentPending) {
    return (
      <Alert>
        <AlertTitle>Consent Pending</AlertTitle>
        <AlertDescription>
          The interaction was stored but <strong>no analysis was run</strong> because consent was not given.
          <br />
          <span className="mt-1 block text-xs text-muted-foreground">
            Ref ID: <code className="font-mono">{result.anonymizedRefId}</code>
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  const a = result.analysis!;
  return (
    <div className="space-y-5">
      {/* Ref ID */}
      <div className="rounded-md bg-muted px-3 py-2 text-xs">
        <span className="font-medium">Interaction ID: </span>
        <code className="font-mono">{result.interactionId}</code>
        <span className="mx-2 text-muted-foreground">·</span>
        <span className="font-medium">Ref ID: </span>
        <code className="font-mono">{result.anonymizedRefId}</code>
        <span className="ml-2 text-muted-foreground">(save this for status lookup)</span>
      </div>

      {/* SVI Gauge */}
      <SviGauge score={a.sviScore} category={a.riskCategory} />

      <Separator />

      {/* Trauma Indicators */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold">Trauma Indicators</h4>
        <TraumaChips indicators={a.traumaIndicators} />
      </div>

      <Separator />

      {/* Recommendation */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Recommendation</h4>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="text-sm">
            {actionLabel(a.actionType)}
          </Badge>
          <Badge variant={priorityColor(a.priority)} className="text-sm capitalize">
            {a.priority} priority
          </Badge>
          {a.escalated && (
            <Badge variant="destructive" className="text-sm">
              ⚡ Escalated
            </Badge>
          )}
          {a.notified && (
            <Badge variant="destructive" className="text-sm">
              📢 Authority Notified
            </Badge>
          )}
        </div>
        {a.assignedAuthority && (
          <p className="text-sm text-muted-foreground">
            Assigned to: <span className="font-medium text-foreground">{a.assignedAuthority}</span>
          </p>
        )}
      </div>

      <Separator />

      {/* Score Breakdown */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold">Score Breakdown</h4>
        <BreakdownTable breakdown={a.breakdown} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Submission Form                                                       */
/* ------------------------------------------------------------------ */

function SubmitForm() {
  const [channel, setChannel] = useState<Channel>("chatbot");
  const [language, setLanguage] = useState<LanguageCode>("auto");
  const [consent, setConsent] = useState(false);
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAudioChannel = channel === "voice" || channel === "ivrs";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await submitInteraction({
        data: {
          channel,
          languageCode: language,
          rawText: isAudioChannel ? undefined : text || undefined,
          audioUrl: isAudioChannel ? audioUrl || undefined : undefined,
          consentGiven: consent,
        },
      });
      setResult(res as SubmitResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Interaction</CardTitle>
          <CardDescription>
            Submit a text or audio interaction for TRACE analysis. Consent is required for analysis to run.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Channel */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="channel">Channel</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
                  <SelectTrigger id="channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chatbot">Chatbot</SelectItem>
                    <SelectItem value="webform">Web Form</SelectItem>
                    <SelectItem value="app">Mobile App</SelectItem>
                    <SelectItem value="voice">Voice</SelectItem>
                    <SelectItem value="ivrs">IVRS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as LanguageCode)}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="mr">Marathi</SelectItem>
                    <SelectItem value="ta">Tamil</SelectItem>
                    <SelectItem value="te">Telugu</SelectItem>
                    <SelectItem value="bn">Bengali</SelectItem>
                    <SelectItem value="gu">Gujarati</SelectItem>
                    <SelectItem value="kn">Kannada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Input */}
            {isAudioChannel ? (
              <div className="space-y-1.5">
                <Label htmlFor="audioUrl">Audio URL</Label>
                <Input
                  id="audioUrl"
                  type="url"
                  placeholder="https://storage.example.com/recording.wav"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The mock ASR provider will generate a deterministic transcript from this URL.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="rawText">Message / Transcript</Label>
                <Textarea
                  id="rawText"
                  placeholder="Enter the caller's message here…"
                  rows={5}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Consent */}
            <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="consent" className="cursor-pointer text-sm leading-snug">
                I confirm the caller has given explicit consent for their interaction to be analyzed and stored for
                welfare assessment purposes.
              </Label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="break-words text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Analyzing…" : "Run TRACE Analysis"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            SVI score, risk category, trauma indicators, and recommended action will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <ResultsPanel result={result} />
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">Submit an interaction to see results.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status Lookup                                                         */
/* ------------------------------------------------------------------ */

function StatusLookup() {
  const [refId, setRefId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusResponse>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const res = await getStatusByRef({ data: { refId } });
      setStatus(res as StatusResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Check Status by Ref ID</CardTitle>
        <CardDescription>
          Callers can check their case status using the anonymized reference ID — no identity is required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleLookup} className="flex gap-2">
          <Input
            placeholder="e.g. 3a7f2b1c9d4e…"
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
            required
            className="font-mono"
          />
          <Button type="submit" disabled={loading || !refId.trim()}>
            {loading ? "…" : "Lookup"}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status === null && !loading && !error && (
          <p className="text-sm text-muted-foreground">Enter a ref ID to check status.</p>
        )}

        {status !== null && (
          <div className="space-y-3 rounded-md border p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Consent:</span>
              {status.consentPending ? (
                <Badge variant="secondary">Pending</Badge>
              ) : (
                <Badge variant="default">Given</Badge>
              )}
            </div>
            {status.sviScore !== null && (
              <div className="space-y-1">
                <SviGauge score={status.sviScore} category={status.riskCategory ?? "low"} />
              </div>
            )}
            {status.recommendation && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{actionLabel(status.recommendation.action_type)}</Badge>
                <Badge variant={priorityColor(status.recommendation.priority)} className="capitalize">
                  {status.recommendation.priority}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {status.recommendation.status}
                </Badge>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Created: {status.createdAt ? new Date(status.createdAt).toLocaleString() : "—"}
            </p>
          </div>
        )}

        {status === null && !loading && error === null && refId && (
          <p className="text-sm text-muted-foreground">No case found for that ref ID.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard (authenticated)                                             */
/* ------------------------------------------------------------------ */

function DashboardSection() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<unknown>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashError, setDashError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) throw new Error(error?.message ?? "Login failed");
      setToken(data.session.access_token);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : String(err));
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLoadDashboard() {
    setDashError(null);
    setDashLoading(true);
    try {
      const res = await getCaseDashboard({
        data: undefined,
        headers: { Authorization: `Bearer ${token}` },
      } as never);
      setDashboard(res);
    } catch (err: unknown) {
      setDashError(err instanceof Error ? err.message : String(err));
    } finally {
      setDashLoading(false);
    }
  }

  if (!token) {
    return (
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Staff Sign In</CardTitle>
          <CardDescription>Sign in with your authorized staff account to view the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {authError && (
              <Alert variant="destructive">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={authLoading}>
              {authLoading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  const dash = dashboard as {
    roles: string[];
    totals: { cases: number; critical: number; high: number };
    cases: Array<{ assessmentId: string; sviScore: number; riskCategory: string; traumaIndicators: string[]; computedAt: string }>;
  } | null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Signed in · <Button variant="link" className="h-auto p-0 text-sm" onClick={() => setToken("")}>Sign out</Button>
        </p>
        <Button onClick={handleLoadDashboard} disabled={dashLoading} size="sm">
          {dashLoading ? "Loading…" : "Load Cases"}
        </Button>
      </div>

      {dashError && (
        <Alert variant="destructive">
          <AlertDescription>{dashError}</AlertDescription>
        </Alert>
      )}

      {dash && (
        <div className="space-y-4">
          {/* Totals */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Cases", value: dash.totals.cases },
              { label: "High Risk", value: dash.totals.high, cls: "text-orange-600" },
              { label: "Critical", value: dash.totals.critical, cls: "text-red-600" },
            ].map(({ label, value, cls }) => (
              <Card key={label}>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold tabular-nums ${cls ?? ""}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Case list */}
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Assessment ID</th>
                  <th className="px-3 py-2 text-left font-medium">SVI Score</th>
                  <th className="px-3 py-2 text-left font-medium">Risk</th>
                  <th className="px-3 py-2 text-left font-medium">Indicators</th>
                  <th className="px-3 py-2 text-left font-medium">Computed At</th>
                </tr>
              </thead>
              <tbody>
                {dash.cases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                      No cases visible for your role.
                    </td>
                  </tr>
                ) : (
                  dash.cases.map((c) => (
                    <tr key={c.assessmentId} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">{c.assessmentId.slice(0, 8)}…</td>
                      <td className="px-3 py-2 font-mono">{c.sviScore?.toFixed(1)}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${riskColor(c.riskCategory)}`}>
                          {c.riskCategory}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(c.traumaIndicators ?? []).slice(0, 3).map((ind) => (
                            <Badge key={ind} variant="outline" className="text-xs capitalize">
                              {ind.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {c.computedAt ? new Date(c.computedAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */

function TracePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              TRACE
            </h1>
            <p className="text-xs text-muted-foreground">
              Trauma Risk Assessment &amp; Care Escalation — Pipeline Test Console
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Backend Test Mode
          </Badge>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Tabs defaultValue="submit">
          <TabsList className="mb-6">
            <TabsTrigger value="submit">Submit Interaction</TabsTrigger>
            <TabsTrigger value="status">Status Lookup</TabsTrigger>
            <TabsTrigger value="dashboard">Staff Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="submit">
            <SubmitForm />
          </TabsContent>

          <TabsContent value="status">
            <StatusLookup />
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardSection />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-3 text-xs text-muted-foreground">
          TRACE v1 · Minimal test console · RLS enforced on all data endpoints
        </div>
      </footer>
    </div>
  );
}
