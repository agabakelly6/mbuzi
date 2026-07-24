-- ============================================================================
-- Real menu data for Rubaga — enough to actually test order placement.
-- ============================================================================
-- Not "fake" seed data — every name/description/price here is transcribed
-- from src/data/menu.ts, the same source-of-truth comment that file itself
-- uses ("Sourced from the real YPA Mbuzi Choma printed menu"). A
-- representative subset (one item with variations, a few plain ones,
-- across four categories) rather than the full ~90-item catalog — enough
-- to exercise the ordering flow end to end; porting the rest is a
-- separate follow-up, not required to prove the pipeline works.

insert into public.menu_categories (id, branch_id, name, sort_order)
values
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Breakfast', 1),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Main Course', 2),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Burgers', 3),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Drinks', 4);

insert into public.menu_items (branch_id, category_id, name, description, base_price, variations, availability, is_featured, is_chef_pick)
values
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Goat Katogo', 'A rich vegetable stew served with your choice of rice, matooke, potatoes, and chapati.',
   10000, '[]', 'available', false, false),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Choma Wrap', 'Chapati rolled with Mbuzi sauces, goat strips, and Spanish egg.',
   10000, '[]', 'available', false, false),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
   'Mbuzi Choma Special', 'Tender goat grilled the chef''s way.',
   40000,
   '[{"id":"without-accompaniments","label":"Without Accompaniments","price":40000},{"id":"with-accompaniments","label":"With Accompaniments","price":45000}]',
   'available', true, true),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
   'Flaming Skewers', 'Tender, marinated goat meat grilled on skewers until smoky, juicy, and flavorful.',
   38000, '[]', 'available', false, false),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003',
   'Mbuzi Choma Burger', 'Goat patty, fresh tomato, onions, lettuce, onion rings.',
   40000, '[]', 'available', false, false),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004',
   'Soda', 'Assorted soft drinks.',
   3000, '[]', 'available', false, false),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004',
   'Water', 'Still bottled water.',
   3000, '[]', 'available', false, false);
