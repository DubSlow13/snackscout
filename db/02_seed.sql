-- SnackScout Prototype 2
-- Seed data: 3-5 realistic test rows per table (fictional users and stores)
-- Run only after db/01_schema.sql.
-- UUIDs are fixed so foreign-key relationships are reproducible.
-- Store addresses/coordinates are SYNTHETIC and do not represent verified real stores.

BEGIN;

-- 1. Users (4)
INSERT INTO public.users (user_id, name, email, role)
VALUES
('11111111-1111-4111-8111-111111111111', 'Alex Rivera', 'alex@example.com', 'shopper'),
('22222222-2222-4222-8222-222222222222', 'Jordan Lee', 'jordan@example.com', 'shopper'),
('33333333-3333-4333-8333-333333333333', 'Casey Morgan', 'casey@example.com', 'employee'),
('44444444-4444-4444-8444-444444444444', 'Taylor Brooks', 'taylor@example.com', 'employee')
ON CONFLICT (user_id) DO NOTHING;

-- 2. Products (4)
INSERT INTO public.products (product_id, name, brand, flavor, category, barcode)
VALUES
('55555555-5555-4555-8555-555555555555', 'Doritos Nacho Cheese', 'Doritos', 'Nacho Cheese', 'Chips', NULL),
('66666666-6666-4666-8666-666666666666', 'Red Bull Energy Drink', 'Red Bull', 'Original', 'Energy Drinks', NULL),
('77777777-7777-4777-8777-777777777777', 'Takis Fuego', 'Takis', 'Fuego', 'Chips', NULL),
('88888888-8888-4888-8888-888888888888', 'Monster Energy', 'Monster', 'Original', 'Energy Drinks', NULL)
ON CONFLICT (product_id) DO NOTHING;

-- 3. Stores (4)
INSERT INTO public.stores
    (store_id, store_name, branch_name, address, latitude, longitude, operating_hours)
VALUES
('99999999-9999-4999-8999-999999999999', 'SnackStop', 'Campus', '100 Example Lane, Chico, CA 95928', 39.728500, -121.837500, '7 AM - 11 PM'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'SnackStop', 'North Chico', '200 Example Lane, Chico, CA 95973', 39.765000, -121.850000, '6 AM - 12 AM'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Campus Corner Market', 'Downtown', '300 Example Lane, Chico, CA 95928', 39.731000, -121.841000, '8 AM - 10 PM'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'QuickMart', 'South Chico', '400 Example Lane, Chico, CA 95928', 39.700000, -121.820000, '24 Hours')
ON CONFLICT (store_id) DO NOTHING;

-- 4. Product Reports (5; two dated reports for Red Bull at SnackStop Campus)
INSERT INTO public.product_reports
    (report_id, product_id, store_id, user_id, price, availability_status, description, submitted_at)
VALUES
('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '66666666-6666-4666-8666-666666666666', '99999999-9999-4999-8999-999999999999', '11111111-1111-4111-8111-111111111111', 2.99, 'in_stock', 'Initial price report', NOW() - INTERVAL '3 days'),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '66666666-6666-4666-8666-666666666666', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 3.49, 'out_of_stock', 'Currently sold out', NOW() - INTERVAL '2 days'),
('ffffffff-ffff-4fff-8fff-ffffffffffff', '55555555-5555-4555-8555-555555555555', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 4.29, 'in_stock', 'Several bags available', NOW() - INTERVAL '1 day'),
('10101010-1010-4010-8010-101010101010', '77777777-7777-4777-8777-777777777777', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', '22222222-2222-4222-8222-222222222222', 3.79, 'in_stock', 'Product available', NOW() - INTERVAL '1 day'),
('12121212-1212-4212-8212-121212121212', '66666666-6666-4666-8666-666666666666', '99999999-9999-4999-8999-999999999999', '22222222-2222-4222-8222-222222222222', 2.79, 'in_stock', 'Updated price report', NOW())
ON CONFLICT (report_id) DO NOTHING;

-- 5. Employee Store Associations (4; one pending)
INSERT INTO public.employee_store_associations
    (association_id, user_id, store_id, verification_status, verified_at)
VALUES
('13131313-1313-4313-8313-131313131313', '33333333-3333-4333-8333-333333333333', '99999999-9999-4999-8999-999999999999', 'approved', NOW()),
('14141414-1414-4414-8414-141414141414', '33333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'pending', NULL),
('15151515-1515-4515-8515-151515151515', '44444444-4444-4444-8444-444444444444', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'approved', NOW()),
('16161616-1616-4616-8616-161616161616', '44444444-4444-4444-8444-444444444444', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'approved', NOW())
ON CONFLICT (association_id) DO NOTHING;

-- 6. Report Verifications (4)
INSERT INTO public.report_verifications
    (verification_id, report_id, association_id, verification_status, notes)
VALUES
('17171717-1717-4717-8717-171717171717', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', '13131313-1313-4313-8313-131313131313', 'confirmed', 'Red Bull availability confirmed'),
('18181818-1818-4818-8818-181818181818', 'ffffffff-ffff-4fff-8fff-ffffffffffff', '15151515-1515-4515-8515-151515151515', 'confirmed', 'Doritos availability confirmed'),
('19191919-1919-4919-8919-191919191919', '10101010-1010-4010-8010-101010101010', '16161616-1616-4616-8616-161616161616', 'confirmed', 'Takis availability confirmed'),
('20202020-2020-4020-8020-202020202020', '12121212-1212-4212-8212-121212121212', '13131313-1313-4313-8313-131313131313', 'confirmed', 'Updated Red Bull report confirmed')
ON CONFLICT (verification_id) DO NOTHING;

-- 7. Favorites (4; generic and store-specific)
INSERT INTO public.favorites (favorite_id, user_id, product_id, store_id)
VALUES
('21212121-2121-4121-8121-212121212121', '11111111-1111-4111-8111-111111111111', '66666666-6666-4666-8666-666666666666', NULL),
('22222222-3333-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
('23232323-2323-4323-8323-232323232323', '22222222-2222-4222-8222-222222222222', '77777777-7777-4777-8777-777777777777', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
('24242424-2424-4424-8424-242424242424', '22222222-2222-4222-8222-222222222222', '88888888-8888-4888-8888-888888888888', NULL)
ON CONFLICT (favorite_id) DO NOTHING;

-- 8. Alert Preferences (4; enabled/disabled, generic/store-specific)
INSERT INTO public.alert_preferences (alert_id, user_id, product_id, store_id, alert_type, is_enabled)
VALUES
('25252525-2525-4525-8525-252525252525', '11111111-1111-4111-8111-111111111111', '66666666-6666-4666-8666-666666666666', NULL, 'restock', TRUE),
('26262626-2626-4626-8626-262626262626', '11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'price_change', TRUE),
('27272727-2727-4727-8727-272727272727', '22222222-2222-4222-8222-222222222222', '88888888-8888-4888-8888-888888888888', NULL, 'price_change', FALSE),
('28282828-2828-4828-8828-282828282828', '22222222-2222-4222-8222-222222222222', '77777777-7777-4777-8777-777777777777', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'restock', TRUE)
ON CONFLICT (alert_id) DO NOTHING;

COMMIT;

-- Verification: expected row counts are 4, 4, 4, 5, 4, 4, 4, 4.
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM public.users
UNION ALL SELECT 'products', COUNT(*) FROM public.products
UNION ALL SELECT 'stores', COUNT(*) FROM public.stores
UNION ALL SELECT 'product_reports', COUNT(*) FROM public.product_reports
UNION ALL SELECT 'employee_store_associations', COUNT(*) FROM public.employee_store_associations
UNION ALL SELECT 'report_verifications', COUNT(*) FROM public.report_verifications
UNION ALL SELECT 'favorites', COUNT(*) FROM public.favorites
UNION ALL SELECT 'alert_preferences', COUNT(*) FROM public.alert_preferences;
