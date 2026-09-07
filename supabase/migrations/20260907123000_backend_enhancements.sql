-- TRACE Backend Enhancements Migration
-- Migration: 20260907123000_backend_enhancements.sql
-- Covers: pipeline_status, idempotency, hash lookup, model_version per signal,
-- audit triggers on config tables, assessment_outcomes, pipeline_runs,
-- notification_outbox dead-letter & retry, expanded lexicon, raw media purge

-- 1. Interactions Table Enhancements
ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS pipeline_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS pipeline_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS anonymized_ref_hash text;

-- Add unique constraint for idempotency key if provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'interactions_idempotency_key_key'
  ) THEN
    ALTER TABLE public.interactions ADD CONSTRAINT interactions_idempotency_key_key UNIQUE (idempotency_key);
  END IF;
END $$;

-- Populate anonymized_ref_hash for existing rows if empty
UPDATE public.interactions
SET anonymized_ref_hash = encode(digest(anonymized_ref_id, 'sha256'), 'hex')
WHERE anonymized_ref_hash IS NULL AND anonymized_ref_id IS NOT NULL;

-- 2. Model Version on Stress Signals
ALTER TABLE public.stress_signals
  ADD COLUMN IF NOT EXISTS model_version text NOT NULL DEFAULT 'trace-svi-v1';

-- 3. Partial Flag and Config Version on SVI Assessments
ALTER TABLE public.svi_assessments
  ADD COLUMN IF NOT EXISTS partial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS config_version text NOT NULL DEFAULT 'weights-v1:thresh-v1';

-- 4. Versioning on Config Tables
ALTER TABLE public.svi_weights
  ADD COLUMN IF NOT EXISTS config_version int NOT NULL DEFAULT 1;

ALTER TABLE public.risk_thresholds
  ADD COLUMN IF NOT EXISTS config_version int NOT NULL DEFAULT 1;

-- 5. Audit Triggers on Configuration Tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_weights') THEN
    CREATE TRIGGER audit_weights AFTER INSERT OR UPDATE OR DELETE ON public.svi_weights
      FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_thresholds') THEN
    CREATE TRIGGER audit_thresholds AFTER INSERT OR UPDATE OR DELETE ON public.risk_thresholds
      FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_rules') THEN
    CREATE TRIGGER audit_rules AFTER INSERT OR UPDATE OR DELETE ON public.recommendation_rules
      FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_lexicon') THEN
    CREATE TRIGGER audit_lexicon AFTER INSERT OR UPDATE OR DELETE ON public.risk_lexicon
      FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
END $$;

-- 6. Assessment Outcomes Table (Validating thresholds & outcome feedback)
CREATE TABLE IF NOT EXISTS public.assessment_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  svi_assessment_id uuid NOT NULL REFERENCES public.svi_assessments(id) ON DELETE CASCADE,
  initial_risk_category public.risk_category NOT NULL,
  actual_outcome text NOT NULL,
  outcome_status text NOT NULL CHECK (outcome_status IN ('confirmed', 'over_escalated', 'under_escalated', 'resolved')),
  notes text,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.assessment_outcomes TO authenticated;
GRANT ALL ON public.assessment_outcomes TO service_role;
ALTER TABLE public.assessment_outcomes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assessment_outcomes' AND policyname = 'staff read outcomes'
  ) THEN
    CREATE POLICY "staff read outcomes" ON public.assessment_outcomes FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'counsellor'));
    CREATE POLICY "staff insert outcomes" ON public.assessment_outcomes FOR INSERT TO authenticated
      WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'counsellor'));
  END IF;
END $$;

-- 7. Pipeline Runs Table (Observability & telemetry)
CREATE TABLE IF NOT EXISTS public.pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms int,
  tokens_used int NOT NULL DEFAULT 0,
  model_name text,
  status text NOT NULL CHECK (status IN ('started', 'success', 'partial', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pipeline_runs TO authenticated;
GRANT ALL ON public.pipeline_runs TO service_role;
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pipeline_runs' AND policyname = 'admins read runs'
  ) THEN
    CREATE POLICY "admins read runs" ON public.pipeline_runs FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(),'admin'));
  END IF;
END $$;

-- 8. Additional Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_interactions_ref_hash
  ON public.interactions (anonymized_ref_hash)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_pipeline_status
  ON public.interactions (pipeline_status, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_idempotency
  ON public.interactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_interaction
  ON public.pipeline_runs (interaction_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_outcomes_assessment
  ON public.assessment_outcomes (svi_assessment_id);

-- 9. Domain-Specific SC/ST PoA Act Lexicon Expansion
INSERT INTO public.risk_lexicon (language_code, phrase, indicator, severity) VALUES
  ('en', 'caste slur', 'intimidation', 0.9),
  ('en', 'social boycott', 'intimidation', 0.95),
  ('en', 'denied water', 'intimidation', 0.9),
  ('en', 'forced to leave village', 'intimidation', 0.95),
  ('en', 'threat to burn house', 'intimidation', 1.0),
  ('en', 'publicly humiliated', 'intimidation', 0.85),
  ('hi', 'सामाजिक बहिष्कार', 'intimidation', 0.95),
  ('hi', 'गांव से निकाला', 'intimidation', 0.95),
  ('hi', 'घर जलाने की धमकी', 'intimidation', 1.0),
  ('hi', 'पानी नहीं भरने दिया', 'intimidation', 0.9),
  ('hi', 'जातिसूचक गाली', 'intimidation', 0.9),
  ('mr', 'गावातून बहिष्कृत', 'intimidation', 0.95),
  ('mr', 'जातीवाचक शिवीगाळ', 'intimidation', 0.9),
  ('mr', 'पाणी भरण्यास बंदी', 'intimidation', 0.9),
  ('mr', 'घर जाळण्याची धमकी', 'intimidation', 1.0),
  ('ta', 'சாதி கொடுமை', 'intimidation', 0.95),
  ('ta', 'ஊரை விட்டு ஒதுக்கி', 'intimidation', 0.95),
  ('te', 'కుల వివక్ష', 'intimidation', 0.95),
  ('te', 'ఊరి నుండి బహిష్కరణ', 'intimidation', 0.95),
  ('kn', 'ಸಾಮಾಜಿಕ ಬಹಿಷ್ಕಾರ', 'intimidation', 0.95),
  ('kn', 'ಜಾತಿ ನಿಂದನೆ', 'intimidation', 0.9)
ON CONFLICT (language_code, phrase) DO NOTHING;

-- 10. Raw Media Retention Purge Function
CREATE OR REPLACE FUNCTION public.purge_expired_raw_media(retention_days int DEFAULT 30)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  purged_count int;
BEGIN
  UPDATE public.interactions
  SET
    raw_text = '[PURGED_BY_RETENTION_POLICY]',
    audio_url = NULL
  WHERE
    created_at < (now() - (retention_days || ' days')::interval)
    AND (raw_text IS NOT NULL OR audio_url IS NOT NULL)
    AND raw_text <> '[PURGED_BY_RETENTION_POLICY]';

  GET DIAGNOSTICS purged_count = ROW_COUNT;
  RETURN purged_count;
END;
$$;
