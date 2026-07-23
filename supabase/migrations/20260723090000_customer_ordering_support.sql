-- ============================================================================
-- Customer ordering UI support.
-- ============================================================================
-- Gap found while building the customer-facing ordering page: `branches`
-- had exactly one SELECT policy (owner) plus branch_manager's own-branch
-- read added later — nobody else, including a customer just trying to see
-- which branches exist to order from, could read a single row. Same
-- reasoning as menu_items' and promotions' public-read carve-outs: which
-- branches are open is public marketing-level information (the site's own
-- /locations page already shows it from static content), not something
-- that needs a permission grant to view.

create policy branches_select_active_public on public.branches
  for select
  using (status = 'active');
