-- TRACE: notification_outbox delivery columns + performance indexes
-- Migration: 20260906_notification_worker

-- 1. Add delivery-tracking columns to notification_outbox
ALTER TABLE public.notification_outbox
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS retry_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz;

-- 2. Index for worker polling: find queued notifications ordered by creation time
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_created
  ON public.notification_outbox (status, created_at)
  WHERE status IN ('queued', 'failed');

-- 3. Index for worker retry polling
CREATE INDEX IF NOT EXISTS idx_notification_outbox_retry
  ON public.notification_outbox (next_retry_at)
  WHERE status = 'failed' AND retry_count < 5;

-- 4. audit_log: index for table+record lookups (used by compliance queries)
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record
  ON public.audit_log (table_name, record_id);

-- 5. audit_log: index for time-based queries (dashboard / reports)
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON public.audit_log (created_at DESC);

-- 6. stress_signals: index for pipeline reads by interaction
CREATE INDEX IF NOT EXISTS idx_stress_signals_interaction
  ON public.stress_signals (interaction_id)
  WHERE deleted_at IS NULL;

-- 7. svi_assessments: index for dashboard pagination (most recent first)
CREATE INDEX IF NOT EXISTS idx_svi_assessments_computed_at
  ON public.svi_assessments (computed_at DESC)
  WHERE deleted_at IS NULL;

-- 8. svi_assessments: index for risk category filtering
CREATE INDEX IF NOT EXISTS idx_svi_assessments_risk_category
  ON public.svi_assessments (risk_category)
  WHERE deleted_at IS NULL;

-- 9. interactions: index for anonymized_ref_id lookup (used by getStatusByRef)
CREATE INDEX IF NOT EXISTS idx_interactions_ref_id
  ON public.interactions (anonymized_ref_id)
  WHERE deleted_at IS NULL;

-- 10. recommendations: index for assessment lookups
CREATE INDEX IF NOT EXISTS idx_recommendations_assessment
  ON public.recommendations (svi_assessment_id)
  WHERE deleted_at IS NULL;
