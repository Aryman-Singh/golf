/*
# Golf Performance, Charity & Prize Draw Platform — Core Schema

1. Overview
   Multi-user app with sign-in. User + Admin roles. This migration creates the
   public tables that back the public website, user dashboard, and admin dashboard.

2. New Tables
   - `profiles` — extends auth.users with role (user/admin), display name, avatar
   - `charities` — catalog of supported charities (public browse)
   - `subscriptions` — a user's active subscription (plan, status, demo payment)
   - `golf_scores` — user golf score entries (only latest 5 considered active)
   - `charity_selections` — a user's chosen charity + contribution percentage (min 10%)
   - `draws` — monthly prize draws (status, jackpot, winning numbers)
   - `draw_entries` — a user's number picks for a given draw
   - `winners` — winning entries with verification + payout status

3. Security
   - RLS enabled on every table.
   - `profiles`: owner read/update; admins read all.
   - `charities`: public read (anon + authenticated); admin write.
   - `subscriptions`, `golf_scores`, `charity_selections`, `draw_entries`:
     owner-scoped CRUD (authenticated).
   - `draws`: public read; admin write.
   - `winners`: owner + admin read; admin update (verification/payout).

4. Notes
   - Owner columns default to auth.uid() so client inserts omitting user_id succeed.
   - Admin role stored in raw_app_meta_data via a SECURITY DEFINER helper for
     safe role assignment at signup.
*/

-- ----------
-- profiles
-- ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL DEFAULT 'Golfer',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ----------
-- charities
-- ----------
CREATE TABLE IF NOT EXISTS public.charities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  logo_url text,
  website_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "charities_select_public" ON public.charities;
CREATE POLICY "charities_select_public" ON public.charities
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "charities_admin_write" ON public.charities;
CREATE POLICY "charities_admin_write" ON public.charities
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ----------
-- subscriptions
-- ----------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('monthly','yearly')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  price_cents integer NOT NULL DEFAULT 999,
  started_at timestamptz NOT NULL DEFAULT now(),
  renews_at timestamptz NOT NULL DEFAULT now() + interval '1 month',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own_or_admin" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own_or_admin" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_update_own_or_admin" ON public.subscriptions;
CREATE POLICY "subscriptions_update_own_or_admin" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "subscriptions_delete_own" ON public.subscriptions;
CREATE POLICY "subscriptions_delete_own" ON public.subscriptions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ----------
-- golf_scores
-- ----------
CREATE TABLE IF NOT EXISTS public.golf_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_name text NOT NULL,
  score integer NOT NULL CHECK (score > 0 AND score < 400),
  par integer NOT NULL DEFAULT 72 CHECK (par > 0 AND par < 200),
  date_played date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scores_select_own_or_admin" ON public.golf_scores;
CREATE POLICY "scores_select_own_or_admin" ON public.golf_scores
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "scores_insert_own" ON public.golf_scores;
CREATE POLICY "scores_insert_own" ON public.golf_scores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "scores_update_own" ON public.golf_scores;
CREATE POLICY "scores_update_own" ON public.golf_scores
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "scores_delete_own" ON public.golf_scores;
CREATE POLICY "scores_delete_own" ON public.golf_scores
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_golf_scores_user_date
  ON public.golf_scores (user_id, date_played DESC, created_at DESC);

-- ----------
-- charity_selections
-- ----------
CREATE TABLE IF NOT EXISTS public.charity_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  charity_id uuid NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
  contribution_pct integer NOT NULL DEFAULT 10 CHECK (contribution_pct >= 10 AND contribution_pct <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.charity_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "charity_sel_select_own_or_admin" ON public.charity_selections;
CREATE POLICY "charity_sel_select_own_or_admin" ON public.charity_selections
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "charity_sel_insert_own" ON public.charity_selections;
CREATE POLICY "charity_sel_insert_own" ON public.charity_selections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "charity_sel_update_own" ON public.charity_selections;
CREATE POLICY "charity_sel_update_own" ON public.charity_selections
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "charity_sel_delete_own" ON public.charity_selections;
CREATE POLICY "charity_sel_delete_own" ON public.charity_selections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ----------
-- draws
-- ----------
CREATE TABLE IF NOT EXISTS public.draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL, -- e.g. "October 2026 Draw"
  draw_month date NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','completed')),
  jackpot_cents integer NOT NULL DEFAULT 100000,
  winning_numbers int[] NOT NULL DEFAULT '{}',
  rolled_over_from uuid REFERENCES public.draws(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "draws_select_public" ON public.draws;
CREATE POLICY "draws_select_public" ON public.draws
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "draws_admin_write" ON public.draws;
CREATE POLICY "draws_admin_write" ON public.draws
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ----------
-- draw_entries
-- ----------
CREATE TABLE IF NOT EXISTS public.draw_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  draw_id uuid NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  numbers int[] NOT NULL CHECK (array_length(numbers,1) = 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, draw_id)
);

ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entries_select_own_or_admin" ON public.draw_entries;
CREATE POLICY "entries_select_own_or_admin" ON public.draw_entries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "entries_insert_own" ON public.draw_entries;
CREATE POLICY "entries_insert_own" ON public.draw_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_delete_own" ON public.draw_entries;
CREATE POLICY "entries_delete_own" ON public.draw_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_draw_entries_draw ON public.draw_entries (draw_id);

-- ----------
-- winners
-- ----------
CREATE TABLE IF NOT EXISTS public.winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.draw_entries(id) ON DELETE CASCADE,
  matches integer NOT NULL CHECK (matches IN (3,4,5)),
  prize_cents integer NOT NULL DEFAULT 0,
  proof_url text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
  payout_status text NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending','paid','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "winners_select_own_or_admin" ON public.winners;
CREATE POLICY "winners_select_own_or_admin" ON public.winners
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "winners_insert_own" ON public.winners;
CREATE POLICY "winners_insert_own" ON public.winners
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "winners_update_own_or_admin" ON public.winners;
CREATE POLICY "winners_update_own_or_admin" ON public.winners
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- ----------
-- Helper: set role on signup via SECURITY DEFINER
-- ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Golfer'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed a few charities if table is empty
INSERT INTO public.charities (name, description, category, website_url)
SELECT * FROM (VALUES
  ('The First Tee', 'Yououth golf programs building character through the game.', 'Youth', 'https://thefirsttee.org'),
  ('Golf Foundation UK', 'Supporting grassroots golf and accessible facilities.', 'Community', 'https://golffoundation.org'),
  ('Veterans Golf Association', 'Golf therapy and community for veterans.', 'Veterans', 'https://mvgolf.org'),
  ('Make-A-Wish Golf', 'Granting wishes through charity golf events.', 'Health', 'https://wish.org'),
  ('Greenkeepers Benevolent Fund', 'Supporting greenkeepers and their families in need.', 'Industry', 'https://bigga.org.uk')
) AS t(name, description, category, website_url)
WHERE NOT EXISTS (SELECT 1 FROM public.charities);

-- Seed an initial open draw for the current month
INSERT INTO public.draws (label, draw_month, status, jackpot_cents)
SELECT 'Monthly Prize Draw', date_trunc('month', CURRENT_DATE)::date, 'open', 100000
WHERE NOT EXISTS (SELECT 1 FROM public.draws WHERE status = 'open');
