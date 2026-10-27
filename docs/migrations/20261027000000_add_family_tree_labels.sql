-- Editable labels shown above a parent's child group in the family tree.
-- Kept in a separate table so existing persons and relationships are untouched.

CREATE TABLE IF NOT EXISTS public.family_tree_labels (
  parent_person_id uuid PRIMARY KEY
    REFERENCES public.persons(id) ON DELETE CASCADE,
  label text NOT NULL
    CHECK (char_length(btrim(label)) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.family_tree_labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active users can view family tree labels"
  ON public.family_tree_labels;
CREATE POLICY "Active users can view family tree labels"
  ON public.family_tree_labels
  FOR SELECT TO authenticated
  USING (public.is_active_user());

DROP POLICY IF EXISTS "Editors can insert family tree labels"
  ON public.family_tree_labels;
CREATE POLICY "Editors can insert family tree labels"
  ON public.family_tree_labels
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_user()
    AND (public.is_admin() OR public.is_editor())
  );

DROP POLICY IF EXISTS "Editors can update family tree labels"
  ON public.family_tree_labels;
CREATE POLICY "Editors can update family tree labels"
  ON public.family_tree_labels
  FOR UPDATE TO authenticated
  USING (
    public.is_active_user()
    AND (public.is_admin() OR public.is_editor())
  )
  WITH CHECK (
    public.is_active_user()
    AND (public.is_admin() OR public.is_editor())
  );

DROP POLICY IF EXISTS "Editors can delete family tree labels"
  ON public.family_tree_labels;
CREATE POLICY "Editors can delete family tree labels"
  ON public.family_tree_labels
  FOR DELETE TO authenticated
  USING (
    public.is_active_user()
    AND (public.is_admin() OR public.is_editor())
  );

REVOKE ALL ON public.family_tree_labels FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_tree_labels TO authenticated;
GRANT ALL ON public.family_tree_labels TO service_role;
