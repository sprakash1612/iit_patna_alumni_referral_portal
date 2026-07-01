-- ============================================================
-- IITP Referral Portal — Supabase Schema
-- Run this entire file in: Supabase Dashboard > SQL Editor
-- ============================================================

-- IMPORTANT: Before running, go to:
-- Authentication > Settings > Disable "Confirm email" (turn OFF)
-- So users can log in immediately after registration.

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  college_email    TEXT        UNIQUE NOT NULL CHECK (college_email LIKE '%@iitp.ac.in'),
  personal_email   TEXT,
  mobile           TEXT,
  show_mobile      BOOLEAN     NOT NULL DEFAULT TRUE,
  current_company  TEXT,
  previous_company JSONB       NOT NULL DEFAULT '[]',
  designation      TEXT,
  total_experience TEXT,
  course           TEXT,
  linkedin_url     TEXT,
  is_verified      BOOLEAN     NOT NULL DEFAULT TRUE,
  is_admin         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.skills (
  id         SERIAL      PRIMARY KEY,
  name       TEXT        UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_skills (
  user_id  UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES public.skills(id)   ON DELETE CASCADE,
  PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.job_posts (
  id          SERIAL      PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_title   TEXT        NOT NULL,
  company     TEXT        NOT NULL,
  location    TEXT,
  job_type    TEXT        NOT NULL DEFAULT 'full-time'
                CHECK (job_type IN ('full-time','part-time','internship','remote','contract')),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referral_requests (
  id           SERIAL      PRIMARY KEY,
  requester_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referee_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_post_id  INTEGER     REFERENCES public.job_posts(id) ON DELETE SET NULL,
  message      TEXT,
  status       TEXT        NOT NULL DEFAULT 'sent',
  is_seen      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER referral_requests_updated_at
  BEFORE UPDATE ON public.referral_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PASSWORD RESET VIA PERSONAL EMAIL VERIFICATION (no email needed)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.reset_password_by_personal_email(
  p_college_email  TEXT,
  p_personal_email TEXT,
  p_new_password   TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF length(p_new_password) < 8 THEN
    RETURN 'error: password must be at least 8 characters';
  END IF;

  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE college_email   = lower(trim(p_college_email))
    AND personal_email IS NOT NULL
    AND lower(personal_email) = lower(trim(p_personal_email));

  IF v_user_id IS NULL THEN
    RETURN 'error: no account found or personal email does not match';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at         = now()
  WHERE id = v_user_id;

  RETURN 'success';
END;
$$;

-- Allow unauthenticated users to call this function
GRANT EXECUTE ON FUNCTION public.reset_password_by_personal_email TO anon;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_requests  ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: auth users can read all"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles: users insert own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: users update own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());
CREATE POLICY "profiles: admin can update any"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "profiles: admin can delete any"
  ON public.profiles FOR DELETE TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- skills
CREATE POLICY "skills: auth users read all"
  ON public.skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "skills: auth users insert"
  ON public.skills FOR INSERT TO authenticated WITH CHECK (true);

-- user_skills
CREATE POLICY "user_skills: auth users read all"
  ON public.user_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_skills: users manage own"
  ON public.user_skills FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- job_posts
CREATE POLICY "job_posts: auth users read all"
  ON public.job_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "job_posts: users insert own"
  ON public.job_posts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "job_posts: users delete own"
  ON public.job_posts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- referral_requests
CREATE POLICY "referral_requests: users see own sent or received"
  ON public.referral_requests FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid() OR
    referee_id   = auth.uid() OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );
CREATE POLICY "referral_requests: users insert as requester"
  ON public.referral_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());
CREATE POLICY "referral_requests: referee can update is_seen"
  ON public.referral_requests FOR UPDATE TO authenticated
  USING (referee_id = auth.uid());

-- ============================================================
-- GUEST ACCESS — Public views (no PII), guest referral requests
-- Run this section in Supabase SQL Editor to enable guest access
-- ============================================================

-- Public profiles view (NO email, NO mobile)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, name, designation, current_company, previous_company, total_experience
FROM public.profiles
WHERE is_verified = TRUE;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Public job posts view (poster name/company only — NO email)
CREATE OR REPLACE VIEW public.public_job_posts AS
SELECT
  jp.id, jp.job_title, jp.company, jp.location, jp.job_type, jp.description, jp.created_at, jp.user_id,
  p.name  AS poster_name,
  p.designation AS poster_designation,
  p.current_company AS poster_company
FROM public.job_posts jp
LEFT JOIN public.profiles p ON p.id = jp.user_id;

GRANT SELECT ON public.public_job_posts TO anon, authenticated;

-- RPC: get all public members with skills (for guest network browsing)
CREATE OR REPLACE FUNCTION public.get_public_members()
RETURNS TABLE(
  id UUID, name TEXT, designation TEXT,
  current_company TEXT, previous_company JSONB,
  total_experience TEXT, skills TEXT[]
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    p.id, p.name, p.designation, p.current_company,
    p.previous_company, p.total_experience,
    COALESCE(array_agg(s.name) FILTER (WHERE s.name IS NOT NULL), ARRAY[]::TEXT[]) AS skills
  FROM public.profiles p
  LEFT JOIN public.user_skills us ON us.user_id = p.id
  LEFT JOIN public.skills s ON s.id = us.skill_id
  WHERE p.is_verified = TRUE
  GROUP BY p.id, p.name, p.designation, p.current_company, p.previous_company, p.total_experience
  ORDER BY p.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_members() TO anon, authenticated;

-- Guest referral requests table (for non-IITP users)
CREATE TABLE IF NOT EXISTS public.guest_referral_requests (
  id          SERIAL      PRIMARY KEY,
  referee_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_post_id INTEGER     REFERENCES public.job_posts(id) ON DELETE SET NULL,
  guest_name  TEXT        NOT NULL,
  guest_email TEXT        NOT NULL,
  guest_mobile TEXT,
  message     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.guest_referral_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_referral_requests: anyone can insert"
  ON public.guest_referral_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "guest_referral_requests: referee or admin can read"
  ON public.guest_referral_requests FOR SELECT TO authenticated
  USING (referee_id = auth.uid() OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Allow anon to call job_posts (for guest job feed fallback)
CREATE POLICY "job_posts: anon can read all"
  ON public.job_posts FOR SELECT TO anon USING (true);

-- ============================================================
-- MIGRATION: Add course and linkedin_url to existing profiles
-- Run this in Supabase SQL Editor on existing databases
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- ============================================================
-- UPDATE public views to include course (not linkedin_url)
-- Run after adding linkedin_url and course columns
-- ============================================================
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, name, designation, current_company, previous_company, total_experience, course
FROM public.profiles
WHERE is_verified = TRUE;

CREATE OR REPLACE FUNCTION public.get_public_members()
RETURNS TABLE(
  id UUID, name TEXT, designation TEXT,
  current_company TEXT, previous_company JSONB,
  total_experience TEXT, course TEXT, skills TEXT[]
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    p.id, p.name, p.designation, p.current_company,
    p.previous_company, p.total_experience, p.course,
    COALESCE(array_agg(s.name) FILTER (WHERE s.name IS NOT NULL), ARRAY[]::TEXT[]) AS skills
  FROM public.profiles p
  LEFT JOIN public.user_skills us ON us.user_id = p.id
  LEFT JOIN public.skills s ON s.id = us.skill_id
  WHERE p.is_verified = TRUE
  GROUP BY p.id, p.name, p.designation, p.current_company, p.previous_company, p.total_experience, p.course
  ORDER BY p.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_members() TO anon, authenticated;
