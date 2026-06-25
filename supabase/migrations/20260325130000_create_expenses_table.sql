CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'outros'
    CHECK (category IN ('pessoal', 'equipamentos', 'materiais', 'servicos', 'viagens', 'outros')),
  planned_amount numeric NOT NULL DEFAULT 0 CHECK (planned_amount >= 0),
  actual_amount numeric NOT NULL DEFAULT 0 CHECK (actual_amount >= 0),
  expense_date date,
  status text NOT NULL DEFAULT 'previsto'
    CHECK (status IN ('previsto', 'realizado', 'cancelado')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses of their projects"
  ON public.expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = expenses.project_id
        AND (p.owner_id = auth.uid() OR p.manager_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gerente'))
    )
  );

CREATE POLICY "Users can manage expenses of their projects"
  ON public.expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = expenses.project_id
        AND (p.owner_id = auth.uid() OR p.manager_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gerente'))
    )
  );

CREATE OR REPLACE FUNCTION public.sync_project_spent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_project_id uuid;
  new_spent numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_project_id := OLD.project_id;
  ELSE
    target_project_id := NEW.project_id;
  END IF;

  SELECT COALESCE(SUM(actual_amount), 0)
  INTO new_spent
  FROM public.expenses
  WHERE project_id = target_project_id
    AND status = 'realizado';

  UPDATE public.projects
  SET spent = new_spent,
      updated_at = now()
  WHERE id = target_project_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS expenses_sync_project_spent ON public.expenses;

CREATE TRIGGER expenses_sync_project_spent
AFTER INSERT OR UPDATE OF actual_amount, status OR DELETE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.sync_project_spent();

UPDATE public.projects p
SET spent = COALESCE((
  SELECT SUM(actual_amount)
  FROM public.expenses e
  WHERE e.project_id = p.id AND e.status = 'realizado'
), 0),
updated_at = now();
