/*
# Storage policies for winner-proof bucket + admin bootstrap helper

1. Storage
   - winner-proof bucket: authenticated users can upload to their own folder,
     public read for viewing proof, admin full access.

2. Admin bootstrap
   - SECURITY DEFINER function promote_first_admin(): if no admin exists in
     profiles, promote the calling user. Lets the first signup become admin.
   - Also a promote_admin(email) function restricted to existing admins.
*/

-- Storage policies for winner-proof bucket
DROP POLICY IF EXISTS "proof_select_all" ON storage.objects;
CREATE POLICY "proof_select_all" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'winner-proof');

DROP POLICY IF EXISTS "proof_insert_own" ON storage.objects;
CREATE POLICY "proof_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'winner-proof' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "proof_update_own" ON storage.objects;
CREATE POLICY "proof_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'winner-proof' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'winner-proof' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "proof_admin_all" ON storage.objects;
CREATE POLICY "proof_admin_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'winner-proof' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (bucket_id = 'winner-proof' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Admin bootstrap: promote the first user if no admin exists yet
CREATE OR REPLACE FUNCTION public.promote_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  SELECT count(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  IF admin_count = 0 THEN
    UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- Admin-only: promote another user by email
CREATE OR REPLACE FUNCTION public.promote_admin(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  SELECT role = 'admin' INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT caller_is_admin THEN
    RAISE EXCEPTION 'Only admins can promote other users';
  END IF;
  UPDATE public.profiles SET role = 'admin' WHERE email = target_email;
  RETURN found;
END;
$$;
