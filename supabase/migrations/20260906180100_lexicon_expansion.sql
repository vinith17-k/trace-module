-- TRACE: Expanded multilingual risk lexicon
-- Adds ~60 additional phrases across all 8 supported languages
-- covering: domestic violence, physical abuse, witness intimidation,
-- neglect/abandonment, social isolation, financial coercion, child harm

INSERT INTO public.risk_lexicon (language_code, phrase, indicator, severity) VALUES

-- ============================================================
-- ENGLISH — expanded
-- ============================================================
('en','want to die','suicidal_ideation',0.95),
('en','rather be dead','suicidal_ideation',0.9),
('en','not worth living','suicidal_ideation',0.85),
('en','hurt myself','suicidal_ideation',0.8),
('en','they will kill me','intimidation',0.95),
('en','threatened with a knife','intimidation',0.95),
('en','threatened with gun','intimidation',0.95),
('en','stalking me','intimidation',0.8),
('en','following me','intimidation',0.65),
('en','hit me','physical_violence',0.8),
('en','slapped me','physical_violence',0.75),
('en','kicked me','physical_violence',0.75),
('en','burned me','physical_violence',0.9),
('en','locked in the house','social_isolation',0.8),
('en','not allowed to go out','social_isolation',0.7),
('en','taken my phone','social_isolation',0.7),
('en','no money for food','neglect',0.7),
('en','children are hungry','neglect',0.8),
('en','child is being hurt','neglect',0.9),
('en','forced to sign','financial_coercion',0.75),
('en','took all my money','financial_coercion',0.8),
('en','no one listens to me','social_isolation',0.55),

-- ============================================================
-- HINDI — expanded
-- ============================================================
('hi','मरना चाहती हूँ','suicidal_ideation',0.95),
('hi','मरना चाहता हूँ','suicidal_ideation',0.95),
('hi','जिंदगी खत्म करना','suicidal_ideation',0.9),
('hi','जान से मार देंगे','intimidation',0.95),
('hi','चाकू से धमकाया','intimidation',0.9),
('hi','पीछा कर रहे हैं','intimidation',0.75),
('hi','घर से बाहर नहीं जाने देते','social_isolation',0.75),
('hi','फोन छीन लिया','social_isolation',0.7),
('hi','बच्चे भूखे हैं','neglect',0.8),
('hi','पैसे नहीं देते','financial_coercion',0.7),
('hi','जलाया','physical_violence',0.9),
('hi','थप्पड़ मारा','physical_violence',0.75),

-- ============================================================
-- MARATHI — expanded
-- ============================================================
('mr','मला मारायला येतात','intimidation',0.9),
('mr','घरात बंद केले','social_isolation',0.8),
('mr','मुले उपाशी आहेत','neglect',0.8),
('mr','मला जगायचे नाही','suicidal_ideation',0.9),
('mr','दगडाने मारले','physical_violence',0.85),

-- ============================================================
-- TAMIL — expanded
-- ============================================================
('ta','என்னை அடிக்கிறார்கள்','physical_violence',0.85),
('ta','வெளியே போக விடுவதில்லை','social_isolation',0.75),
('ta','என்னை கொல்வதாக மிரட்டுகிறார்கள்','intimidation',0.95),
('ta','வாழ விரும்பவில்லை','suicidal_ideation',0.9),
('ta','குழந்தைகள் பசியாக உள்ளனர்','neglect',0.8),

-- ============================================================
-- TELUGU — expanded
-- ============================================================
('te','నన్ను కొడుతున్నారు','physical_violence',0.85),
('te','బయటకి వెళ్ళనివ్వడం లేదు','social_isolation',0.75),
('te','చంపుతామని బెదిరిస్తున్నారు','intimidation',0.95),
('te','బ్రతకాలనిపించడం లేదు','suicidal_ideation',0.9),
('te','పిల్లలకు తినడానికి లేదు','neglect',0.8),

-- ============================================================
-- BENGALI — expanded
-- ============================================================
('bn','আমাকে মারছে','physical_violence',0.85),
('bn','বাইরে যেতে দেয় না','social_isolation',0.75),
('bn','মেরে ফেলবে বলে ভয় দেখাচ্ছে','intimidation',0.95),
('bn','বাঁচতে চাই না','suicidal_ideation',0.9),
('bn','বাচ্চারা না খেয়ে আছে','neglect',0.8),
('bn','ফোন কেড়ে নিয়েছে','social_isolation',0.7),

-- ============================================================
-- GUJARATI — expanded
-- ============================================================
('gu','મને મારે છે','physical_violence',0.85),
('gu','ઘરની બહાર જવા દેતા નથી','social_isolation',0.75),
('gu','મારી નાખવાની ધમકી','intimidation',0.95),
('gu','જીવવું નથી','suicidal_ideation',0.9),
('gu','બાળકો ભૂખ્યા છે','neglect',0.8),

-- ============================================================
-- KANNADA — expanded
-- ============================================================
('kn','ನನ್ನನ್ನು ಹೊಡೆಯುತ್ತಿದ್ದಾರೆ','physical_violence',0.85),
('kn','ಹೊರಗೆ ಹೋಗಲು ಬಿಡುವುದಿಲ್ಲ','social_isolation',0.75),
('kn','ಕೊಂದುಬಿಡುತ್ತೇನೆ ಎಂದು ಬೆದರಿಕೆ','intimidation',0.95),
('kn','ಬದುಕಬೇಕೆನಿಸುತ್ತಿಲ್ಲ','suicidal_ideation',0.9),
('kn','ಮಕ್ಕಳು ಹಸಿದಿದ್ದಾರೆ','neglect',0.8)

ON CONFLICT (language_code, phrase) DO NOTHING;
