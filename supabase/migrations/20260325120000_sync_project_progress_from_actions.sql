-- Syncs projects.progress from completed actions ratio
CREATE OR REPLACE FUNCTION public.sync_project_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_project_id uuid;
  total_count integer;
  completed_count integer;
  new_progress integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_project_id := OLD.project_id;
  ELSE
    target_project_id := NEW.project_id;
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'concluida')
  INTO total_count, completed_count
  FROM public.actions
  WHERE project_id = target_project_id;

  IF total_count = 0 THEN
    new_progress := 0;
  ELSE
    new_progress := ROUND((completed_count::numeric / total_count::numeric) * 100);
  END IF;

  UPDATE public.projects
  SET progress = new_progress,
      updated_at = now()
  WHERE id = target_project_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS actions_sync_project_progress ON public.actions;

CREATE TRIGGER actions_sync_project_progress
AFTER INSERT OR UPDATE OF status OR DELETE ON public.actions
FOR EACH ROW
EXECUTE FUNCTION public.sync_project_progress();

UPDATE public.projects p
SET progress = COALESCE((
  SELECT CASE
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND((COUNT(*) FILTER (WHERE status = 'concluida')::numeric / COUNT(*)::numeric) * 100)
  END
  FROM public.actions a
  WHERE a.project_id = p.id
), 0),
updated_at = now();
