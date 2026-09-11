ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS pipeline_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS pipeline_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS anonymized_ref_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_interactions_idempotency_key
  ON public.interactions (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interactions_ref_hash ON public.interactions (anonymized_ref_hash);
CREATE INDEX IF NOT EXISTS idx_interactions_pipeline_status ON public.interactions (pipeline_status);

ALTER TABLE public.svi_assessments
  ADD COLUMN IF NOT EXISTS partial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS config_version integer NOT NULL DEFAULT 1;

ALTER TABLE public.notification_outbox
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_message text;

ALTER TABLE public.svi_weights ADD COLUMN IF NOT EXISTS config_version integer NOT NULL DEFAULT 1;
ALTER TABLE public.risk_thresholds ADD COLUMN IF NOT EXISTS config_version integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.pipeline_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_id uuid REFERENCES public.interactions(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  model_name text,
  tokens_used integer,
  status text NOT NULL DEFAULT 'started',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pipeline_runs TO authenticated;
GRANT ALL ON public.pipeline_runs TO service_role;
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read pipeline runs" ON public.pipeline_runs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.assessment_outcomes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  svi_assessment_id uuid NOT NULL REFERENCES public.svi_assessments(id),
  initial_risk_category risk_category NOT NULL,
  actual_outcome text NOT NULL,
  outcome_status text NOT NULL,
  notes text,
  reviewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.assessment_outcomes TO authenticated;
GRANT ALL ON public.assessment_outcomes TO service_role;
ALTER TABLE public.assessment_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read outcomes" ON public.assessment_outcomes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'counsellor'::app_role));
CREATE POLICY "staff insert outcomes" ON public.assessment_outcomes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'counsellor'::app_role));