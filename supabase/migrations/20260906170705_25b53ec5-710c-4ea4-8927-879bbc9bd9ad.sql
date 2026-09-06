
-- ENUMS
CREATE TYPE public.channel_type AS ENUM ('voice','chatbot','ivrs','webform','app');
CREATE TYPE public.signal_type AS ENUM ('lexical','acoustic_pitch','acoustic_pause','speech_rate','sentiment','keyword_flag');
CREATE TYPE public.risk_category AS ENUM ('low','moderate','high','critical');
CREATE TYPE public.action_type AS ENUM ('counselling','legal_aid','medical_assistance','police_intervention','witness_protection','emergency_support','none');
CREATE TYPE public.priority_level AS ENUM ('routine','urgent','immediate');
CREATE TYPE public.recommendation_status AS ENUM ('pending','dispatched','acknowledged','resolved');
CREATE TYPE public.app_role AS ENUM ('counsellor','law_enforcement','admin','district_officer','welfare_authority');

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- INTERACTIONS
CREATE TABLE public.interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel public.channel_type NOT NULL,
  language_code text NOT NULL DEFAULT 'en',
  raw_text text,
  audio_url text,
  consent_given boolean NOT NULL DEFAULT false,
  consent_timestamp timestamptz,
  consent_pending boolean NOT NULL DEFAULT true,
  anonymized_ref_id text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12),'hex'),
  identity_ref uuid,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.interactions TO anon, authenticated;
GRANT SELECT, UPDATE ON public.interactions TO authenticated;
GRANT ALL ON public.interactions TO service_role;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit an interaction" ON public.interactions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "staff read interactions" ON public.interactions FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'counsellor')));
CREATE POLICY "admins update interactions" ON public.interactions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- VICTIM IDENTITY (PII, strictest)
CREATE TABLE public.victim_identity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  contact_number text,
  email text,
  address text,
  assigned_counsellor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.interactions
  ADD CONSTRAINT interactions_identity_ref_fkey FOREIGN KEY (identity_ref) REFERENCES public.victim_identity(id) ON DELETE SET NULL;
GRANT SELECT, INSERT, UPDATE ON public.victim_identity TO authenticated;
GRANT ALL ON public.victim_identity TO service_role;
ALTER TABLE public.victim_identity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin or assigned counsellor read pii" ON public.victim_identity FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (public.has_role(auth.uid(),'admin') OR assigned_counsellor_id = auth.uid()));
CREATE POLICY "admin write pii" ON public.victim_identity FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- STRESS SIGNALS
CREATE TABLE public.stress_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  signal_type public.signal_type NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  numeric_value numeric,
  confidence numeric NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  language_code text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stress_signals TO authenticated;
GRANT ALL ON public.stress_signals TO service_role;
ALTER TABLE public.stress_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read signals" ON public.stress_signals FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'counsellor')));

-- SVI ASSESSMENTS
CREATE TABLE public.svi_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  svi_score numeric NOT NULL CHECK (svi_score >= 0 AND svi_score <= 100),
  risk_category public.risk_category NOT NULL,
  trauma_indicators jsonb NOT NULL DEFAULT '[]'::jsonb,
  model_version text NOT NULL DEFAULT 'trace-svi-v1',
  deleted_at timestamptz,
  computed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.svi_assessments TO authenticated;
GRANT ALL ON public.svi_assessments TO service_role;
ALTER TABLE public.svi_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "counsellors read high risk assessments" ON public.svi_assessments FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (
    public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'counsellor') AND risk_category IN ('high','critical'))
  ));
CREATE POLICY "counsellors update high risk assessments" ON public.svi_assessments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'counsellor') AND risk_category IN ('high','critical')))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'counsellor') AND risk_category IN ('high','critical')));

-- RECOMMENDATIONS
CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  svi_assessment_id uuid NOT NULL REFERENCES public.svi_assessments(id) ON DELETE CASCADE,
  action_type public.action_type NOT NULL,
  priority public.priority_level NOT NULL,
  status public.recommendation_status NOT NULL DEFAULT 'pending',
  assigned_authority text,
  dispatched_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role scoped read recommendations" ON public.recommendations FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (
    public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'law_enforcement') AND action_type IN ('police_intervention','witness_protection'))
    OR (public.has_role(auth.uid(),'counsellor') AND EXISTS (
         SELECT 1 FROM public.svi_assessments a
         WHERE a.id = recommendations.svi_assessment_id AND a.risk_category IN ('high','critical')))
  ));
CREATE POLICY "counsellors and admins update recommendations" ON public.recommendations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'counsellor') AND EXISTS (
      SELECT 1 FROM public.svi_assessments a WHERE a.id = recommendations.svi_assessment_id AND a.risk_category IN ('high','critical'))))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'counsellor'));

-- ESCALATION LOG
CREATE TABLE public.escalation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  actor text NOT NULL DEFAULT 'system',
  action_taken text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.escalation_log TO authenticated;
GRANT ALL ON public.escalation_log TO service_role;
ALTER TABLE public.escalation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read escalations" ON public.escalation_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'counsellor') OR public.has_role(auth.uid(),'law_enforcement'));
CREATE POLICY "staff insert escalations" ON public.escalation_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'counsellor') OR public.has_role(auth.uid(),'law_enforcement'));

-- NOTIFICATION OUTBOX
CREATE TABLE public.notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid REFERENCES public.recommendations(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'webhook',
  target text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notification_outbox TO authenticated;
GRANT ALL ON public.notification_outbox TO service_role;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read outbox" ON public.notification_outbox FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'law_enforcement'));

-- AUDIT LOG (append only)
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rec_id uuid;
BEGIN
  IF (TG_OP = 'DELETE') THEN rec_id := OLD.id; ELSE rec_id := NEW.id; END IF;
  INSERT INTO public.audit_log(table_name, record_id, action, actor_id)
  VALUES (TG_TABLE_NAME, rec_id, TG_OP, auth.uid());
  IF (TG_OP = 'DELETE') THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER audit_interactions AFTER INSERT OR UPDATE OR DELETE ON public.interactions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_victim_identity AFTER INSERT OR UPDATE OR DELETE ON public.victim_identity FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_svi AFTER INSERT OR UPDATE OR DELETE ON public.svi_assessments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_recommendations AFTER INSERT OR UPDATE OR DELETE ON public.recommendations FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- CONFIG TABLES
CREATE TABLE public.svi_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type public.signal_type NOT NULL,
  signal_key text NOT NULL DEFAULT 'default',
  weight numeric NOT NULL,
  max_contribution numeric NOT NULL DEFAULT 100,
  notes text,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (signal_type, signal_key)
);
CREATE TABLE public.risk_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_category public.risk_category NOT NULL UNIQUE,
  min_score numeric NOT NULL,
  max_score numeric NOT NULL
);
CREATE TABLE public.recommendation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_order int NOT NULL DEFAULT 100,
  risk_category public.risk_category NOT NULL,
  required_indicator text,
  action_type public.action_type NOT NULL,
  priority public.priority_level NOT NULL,
  assigned_authority text,
  auto_escalate boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.risk_lexicon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code text NOT NULL,
  phrase text NOT NULL,
  indicator text NOT NULL,
  severity numeric NOT NULL DEFAULT 0.5,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (language_code, phrase)
);

GRANT SELECT ON public.svi_weights, public.risk_thresholds, public.recommendation_rules, public.risk_lexicon TO authenticated;
GRANT ALL ON public.svi_weights, public.risk_thresholds, public.recommendation_rules, public.risk_lexicon TO service_role;
ALTER TABLE public.svi_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_lexicon ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read weights" ON public.svi_weights FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write weights" ON public.svi_weights FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff read thresholds" ON public.risk_thresholds FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write thresholds" ON public.risk_thresholds FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff read rules" ON public.recommendation_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write rules" ON public.recommendation_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff read lexicon" ON public.risk_lexicon FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins write lexicon" ON public.risk_lexicon FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SEED CONFIG
INSERT INTO public.svi_weights (signal_type, signal_key, weight, max_contribution, notes) VALUES
  ('sentiment','distress',22,22,'LLM distress intensity 0-1 * weight'),
  ('sentiment','fear',12,12,'LLM fear intensity 0-1 * weight'),
  ('sentiment','depression',12,12,'LLM depression intensity 0-1 * weight'),
  ('sentiment','suicidal_ideation',30,30,'LLM suicidal ideation intensity 0-1 * weight'),
  ('sentiment','intimidation',14,14,'LLM intimidation intensity 0-1 * weight'),
  ('sentiment','social_isolation',10,10,'LLM social isolation intensity 0-1 * weight'),
  ('lexical','default',8,15,'Lexical density of risk phrases'),
  ('keyword_flag','default',10,25,'Each matched lexicon phrase severity * weight'),
  ('acoustic_pitch','default',10,10,'Normalised pitch variance 0-1'),
  ('acoustic_pause','default',8,8,'Normalised pause frequency 0-1'),
  ('speech_rate','default',8,8,'Normalised speech-rate deviation 0-1');

INSERT INTO public.risk_thresholds (risk_category, min_score, max_score) VALUES
  ('low',0,24.99),('moderate',25,49.99),('high',50,74.99),('critical',75,100);

INSERT INTO public.recommendation_rules (rule_order, risk_category, required_indicator, action_type, priority, assigned_authority, auto_escalate) VALUES
  (10,'critical','suicidal_ideation','emergency_support','immediate','District Mental Health Emergency Cell',true),
  (20,'critical','intimidation','witness_protection','immediate','Witness Protection Cell',true),
  (30,'critical',NULL,'police_intervention','immediate','Local Police Control Room',true),
  (40,'high','intimidation','police_intervention','urgent','Local Police Station',false),
  (50,'high','physical_violence','medical_assistance','urgent','District Hospital',false),
  (60,'high',NULL,'counselling','urgent','Helpline Counselling Unit',false),
  (70,'moderate','legal_issue','legal_aid','routine','District Legal Services Authority',false),
  (80,'moderate',NULL,'counselling','routine','Helpline Counselling Unit',false),
  (90,'low',NULL,'none','routine',NULL,false);

INSERT INTO public.risk_lexicon (language_code, phrase, indicator, severity) VALUES
  ('en','kill myself','suicidal_ideation',1.0),
  ('en','end my life','suicidal_ideation',1.0),
  ('en','no reason to live','suicidal_ideation',0.9),
  ('en','he threatened me','intimidation',0.8),
  ('en','they will hurt my family','intimidation',0.9),
  ('en','beat me','physical_violence',0.8),
  ('en','nobody helps me','social_isolation',0.5),
  ('hi','आत्महत्या','suicidal_ideation',1.0),
  ('hi','जान से मारने की धमकी','intimidation',0.9),
  ('hi','मारपीट','physical_violence',0.8),
  ('mr','आत्महत्या','suicidal_ideation',1.0),
  ('ta','தற்கொலை','suicidal_ideation',1.0),
  ('te','ఆత్మహత్య','suicidal_ideation',1.0),
  ('bn','আত্মহত্যা','suicidal_ideation',1.0),
  ('gu','આપઘાત','suicidal_ideation',1.0),
  ('kn','ಆತ್ಮಹತ್ಯೆ','suicidal_ideation',1.0);
