-- Course state changes must go through the authenticated workflow functions.
-- This prevents a client from changing price, driver, payment or lifecycle
-- fields directly through the REST table endpoint.
drop policy if exists "delivery course client insert" on public.courses_delivery;
drop policy if exists "delivery course controlled update" on public.courses_delivery;
