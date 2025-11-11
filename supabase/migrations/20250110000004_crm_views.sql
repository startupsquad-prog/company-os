-- ============================================================================
-- CRM Schema Views
-- Company OS: Create public views for CRM tables to allow REST API access
-- ============================================================================
-- Purpose: PostgREST only exposes 'public' and 'graphql_public' schemas.
--          Create views in public schema to access crm tables via REST API.
-- ============================================================================

-- Create view for crm.leads
CREATE OR REPLACE VIEW public.leads AS
SELECT 
  id,
  contact_id,
  company_id,
  owner_id,
  status,
  source,
  value,
  probability,
  expected_close_date,
  notes,
  tags,
  meta,
  created_at,
  updated_at,
  created_by,
  deleted_at
FROM crm.leads;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

-- Create INSTEAD OF triggers for INSERT
CREATE OR REPLACE FUNCTION public.leads_insert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO crm.leads (
    id,
    contact_id,
    company_id,
    owner_id,
    status,
    source,
    value,
    probability,
    expected_close_date,
    notes,
    tags,
    meta,
    created_at,
    updated_at,
    created_by,
    deleted_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.contact_id,
    NEW.company_id,
    NEW.owner_id,
    COALESCE(NEW.status, 'new'),
    NEW.source,
    NEW.value,
    NEW.probability,
    NEW.expected_close_date,
    NEW.notes,
    NEW.tags,
    NEW.meta,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now()),
    NEW.created_by,
    NEW.deleted_at
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER leads_insert_trigger
INSTEAD OF INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.leads_insert_trigger();

-- Create INSTEAD OF triggers for UPDATE
CREATE OR REPLACE FUNCTION public.leads_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE crm.leads
  SET
    contact_id = NEW.contact_id,
    company_id = NEW.company_id,
    owner_id = NEW.owner_id,
    status = NEW.status,
    source = NEW.source,
    value = NEW.value,
    probability = NEW.probability,
    expected_close_date = NEW.expected_close_date,
    notes = NEW.notes,
    tags = NEW.tags,
    meta = NEW.meta,
    updated_at = now(),
    created_by = COALESCE(NEW.created_by, OLD.created_by),
    deleted_at = NEW.deleted_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER leads_update_trigger
INSTEAD OF UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.leads_update_trigger();

-- Create INSTEAD OF triggers for DELETE
CREATE OR REPLACE FUNCTION public.leads_delete_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Soft delete by setting deleted_at
  UPDATE crm.leads
  SET deleted_at = now()
  WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER leads_delete_trigger
INSTEAD OF DELETE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.leads_delete_trigger();

-- Create view for crm.interactions
CREATE OR REPLACE VIEW public.interactions AS
SELECT 
  id,
  entity_type,
  entity_id,
  type,
  subject,
  notes,
  scheduled_at,
  duration_minutes,
  outcome,
  meta,
  created_at,
  created_by,
  deleted_at
FROM crm.interactions;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interactions TO authenticated;

-- Create INSTEAD OF triggers for interactions INSERT
CREATE OR REPLACE FUNCTION public.interactions_insert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO crm.interactions (
    id,
    entity_type,
    entity_id,
    type,
    subject,
    notes,
    scheduled_at,
    duration_minutes,
    outcome,
    meta,
    created_at,
    created_by,
    deleted_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.entity_type,
    NEW.entity_id,
    NEW.type,
    NEW.subject,
    NEW.notes,
    NEW.scheduled_at,
    NEW.duration_minutes,
    NEW.outcome,
    NEW.meta,
    COALESCE(NEW.created_at, now()),
    NEW.created_by,
    NEW.deleted_at
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER interactions_insert_trigger
INSTEAD OF INSERT ON public.interactions
FOR EACH ROW
EXECUTE FUNCTION public.interactions_insert_trigger();

-- Create INSTEAD OF triggers for interactions UPDATE
CREATE OR REPLACE FUNCTION public.interactions_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE crm.interactions
  SET
    entity_type = NEW.entity_type,
    entity_id = NEW.entity_id,
    type = NEW.type,
    subject = NEW.subject,
    notes = NEW.notes,
    scheduled_at = NEW.scheduled_at,
    duration_minutes = NEW.duration_minutes,
    outcome = NEW.outcome,
    meta = NEW.meta,
    created_by = COALESCE(NEW.created_by, OLD.created_by),
    deleted_at = NEW.deleted_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER interactions_update_trigger
INSTEAD OF UPDATE ON public.interactions
FOR EACH ROW
EXECUTE FUNCTION public.interactions_update_trigger();

-- Create INSTEAD OF triggers for interactions DELETE
CREATE OR REPLACE FUNCTION public.interactions_delete_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Soft delete by setting deleted_at
  UPDATE crm.interactions
  SET deleted_at = now()
  WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER interactions_delete_trigger
INSTEAD OF DELETE ON public.interactions
FOR EACH ROW
EXECUTE FUNCTION public.interactions_delete_trigger();

-- Create view for crm.status_history
CREATE OR REPLACE VIEW public.status_history AS
SELECT 
  id,
  lead_id,
  status,
  previous_status,
  notes,
  created_at,
  created_by
FROM crm.status_history;

-- Grant permissions on the view
GRANT SELECT, INSERT ON public.status_history TO authenticated;

-- Create INSTEAD OF triggers for status_history INSERT (read-only table, only INSERT allowed)
CREATE OR REPLACE FUNCTION public.status_history_insert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO crm.status_history (
    id,
    lead_id,
    status,
    previous_status,
    notes,
    created_at,
    created_by
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.lead_id,
    NEW.status,
    NEW.previous_status,
    NEW.notes,
    COALESCE(NEW.created_at, now()),
    NEW.created_by
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER status_history_insert_trigger
INSTEAD OF INSERT ON public.status_history
FOR EACH ROW
EXECUTE FUNCTION public.status_history_insert_trigger();







