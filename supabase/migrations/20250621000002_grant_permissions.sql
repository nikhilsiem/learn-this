-- Grant table permissions to Supabase API roles
-- (tables were created by postgres superuser, so API roles need explicit grants)

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;
grant all privileges on all routines in schema public to anon, authenticated, service_role;
