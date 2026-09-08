CREATE TABLE public.offline_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  gps_lat numeric,
  gps_lng numeric,
  captured_at timestamptz NOT NULL DEFAULT now(),
  synced boolean NOT NULL DEFAULT false,
  synced_at timestamptz,
  interaction_id uuid REFERENCES public.interactions(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.offline_queue TO anon;
GRANT INSERT, SELECT ON public.offline_queue TO authenticated;
GRANT ALL ON public.offline_queue TO service_role;

ALTER TABLE public.offline_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can queue an offline capture"
  ON public.offline_queue FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admins read offline queue"
  ON public.offline_queue FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_offline_queue_unsynced ON public.offline_queue (synced, captured_at);