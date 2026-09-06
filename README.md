# TRACE Module

Lovable Build Prompt — AI-Enabled Stress & Trauma Assessment Module (Backend-First)

Copy everything below the line into Lovable as your project prompt.

Build the backend only for a system called TRACE (Trauma Risk Assessment & Care Escalation) — a real-time Stress & Trauma Assessment Module for victims/complainants contacting a National Helpline (voice/IVRS, chatbot, web portal, mobile app). Prioritize backend correctness, data model, and Supabase edge functions. Keep the frontend to a single minimal placeholder page (one form + one results panel, no styling effort, no extra screens) — I will rebuild the UI separately. Do not spend generation effort on UI polish, animations, or multiple pages.

Core requirement

Every interaction (voice transcript, chat text, or IVRS input) must be analyzed and converted into a Stress Vulnerability Index (SVI), a risk category, and an auto-recommended action — stored, auditable, and retrievable by authorized roles only.

1. Database schema (Supabase/Postgres)

Create tables with RLS enabled on all of them:

interactions

id (uuid, pk), channel (enum: voice, chatbot, ivrs, webform, app), language_code, raw_text (nullable), audio_url (nullable), created_at, consent_given (bool), consent_timestamp, anonymized_ref_id (text, for cases where identity is withheld)

stress_signals

id, interaction_id (fk), signal_type (enum: lexical, acoustic_pitch, acoustic_pause, speech_rate, sentiment, keyword_flag), value (numeric/jsonb), confidence (numeric 0-1)

svi_assessments

id, interaction_id (fk), svi_score (numeric 0-100), risk_category (enum: low, moderate, high, critical), trauma_indicators (jsonb array: e.g. fear, depression, suicidal_ideation, intimidation, social_isolation), model_version, computed_at

recommendations

id, svi_assessment_id (fk), action_type (enum: counselling, legal_aid, medical_assistance, police_intervention, witness_protection, emergency_support, none), priority (enum: routine, urgent, immediate), status (enum: pending, dispatched, acknowledged, resolved), assigned_authority, dispatched_at

escalation_log

id, recommendation_id (fk), actor (text), action_taken, notes, timestamp

user_roles

id, user_id (fk to auth.users), role (enum: counsellor, law_enforcement, admin, district_officer, welfare_authority)

audit_log

id, table_name, record_id, action, actor_id, timestamp — trigger-based, append-only

RLS rules:

Victims/anonymous callers: insert-only into interactions, no read access to assessments.

counsellor: read/update on svi_assessments + recommendations where risk_category is high/critical only.

law_enforcement: read-only on cases flagged police_intervention or witness_protection.

admin: full read, no destructive delete (soft-delete only).

All PII fields (name, contact, address if present) must live in a separate victim_identity table with the strictest RLS (admin + assigned counsellor only), joined via a non-guessable UUID — never exposed in interactions or logs.

2. Edge Functions (this is where most effort should go)

analyze-text-signals

Input: raw_text, language_code. Steps:

Detect language (support Hindi, English, and at least 6 major Indian languages — Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada — via a language-detection call).

Run sentiment/emotion scoring (call an LLM via API with a strict system prompt: "classify distress, fear, depression, suicidal ideation, social isolation, intimidation cues; return structured JSON only, no diagnosis language").

Extract keyword/phrase risk flags (self-harm language, threats-received language, references to violence) using a maintained multilingual lexicon table risk_lexicon (seed with placeholder rows I can expand later).

Write rows to stress_signals.

analyze-voice-signals

Input: audio_url. Steps:

Transcribe (stub with a pluggable ASR provider interface — function signature only, mock response acceptable for now).

Extract acoustic features: pitch variance, pause frequency/duration, speech rate — as a pluggable interface (mock numeric output acceptable now, but the function contract, input/output types, and DB writes must be real and complete).

Write rows to stress_signals with signal_type = acoustic_*.

compute-svi

Input: interaction_id. Steps:

Pull all stress_signals for the interaction.

Apply a documented weighted-scoring formula (write it as a clearly commented, editable config object/table svi_weights — not hardcoded magic numbers) to produce svi_score 0–100.

Map score → risk_category (configurable thresholds table risk_thresholds, not hardcoded).

Detect specific trauma_indicators as a structured list.

Insert into svi_assessments.

Trigger generate-recommendation.

generate-recommendation

Input: svi_assessment_id. Rule-based decision table (store rules in a recommendation_rules table, not inline code) mapping risk_category + trauma_indicators → action_type + priority. Critical + suicidal_ideation or intimidation → priority=immediate and auto-insert into escalation_log plus a call to notify-authority.

notify-authority

Stub integration (clear function contract + TODO comment for SMS/email/webhook provider) that logs an outbound notification record when priority = immediate or action_type = police_intervention/witness_protection.

get-case-dashboard (RLS-aware read endpoint)

Returns aggregated, role-filtered case data for authorized dashboards — no raw PII unless caller role permits.

3. Non-functional / compliance requirements

Every write to interactions must check consent_given before any analysis function runs; if false, only store the raw record with analysis skipped and a consent_pending flag.

No raw audio or transcript is ever returned to unauthorized roles — analysis functions can read them, but read endpoints for humans only return derived signals/scores unless role = admin/counsellor with case assignment.

All destructive operations are soft-delete + audit-logged.

Support an anonymized_ref_id path so a caller can get their own SVI/recommendation status back without revealing identity to lower-privilege staff.

Multilingual support is data-driven (language_code column everywhere relevant), not hardcoded per-language logic branches.

4. Minimal frontend (keep this small)

One page with:

A text/voice-upload input (channel selector: text or audio) that calls the pipeline (analyze-* → compute-svi → generate-recommendation) end-to-end.

A results panel showing svi_score, risk_category, trauma_indicators, and recommended action_type/priority. No auth screens, no dashboards, no styling system — just enough to prove the pipeline works. I will replace this UI later.

5. Deliverable checklist for you (Lovable) to confirm before finishing

[ ] All tables + RLS policies created and enabled

[ ] All 6 edge functions created with real DB reads/writes (mocked ASR/acoustic providers are fine, but interfaces and data flow must be real)

[ ] Config-driven scoring (svi_weights, risk_thresholds, recommendation_rules) editable via tables, not hardcoded

[ ] Consent gate enforced before analysis

[ ] One minimal end-to-end test page wired to the real pipeline

Do not build additional pages, auth flows, or design polish beyond the single test page above — put all remaining effort into making the backend pipeline (steps 1–4 above) fully functional end-to-end.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3f6a56fb-eff3-49c6-91fa-3ec8d272c796).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
