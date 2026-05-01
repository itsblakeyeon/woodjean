-- Lock function resolution to prevent role-mutable search_path warnings.
ALTER FUNCTION public.delivery_hour_bucket(TIMESTAMPTZ) SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
