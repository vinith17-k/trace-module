ALTER TABLE public.stress_signals ADD COLUMN IF NOT EXISTS model_version text;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE public.svi_assessments
  ALTER COLUMN config_version DROP DEFAULT,
  ALTER COLUMN config_version TYPE text USING config_version::text,
  ALTER COLUMN config_version SET DEFAULT '1';