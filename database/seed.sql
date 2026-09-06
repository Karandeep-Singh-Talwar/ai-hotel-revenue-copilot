-- ==============================================================================
-- SEED DATA: AI HOTEL REVENUE INTELLIGENCE PLATFORM (INDIAN HOTELS)
-- Provides multi-tenant sample agency, properties, comp-sets, rates, and events
-- ==============================================================================

-- 1. Insert Default RMA (Revenue Management Agency)
INSERT INTO agencies (id, name)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Apex Hospitality Revenue Advisors India')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Users
INSERT INTO users (id, agency_id, email, role)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'rohan.revenue@apexhospitality.in', 'revenue_manager'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'gm@claridgesdelhi.com', 'hotel_owner')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Client Hotels (Independent / Heritage Indian Properties)
INSERT INTO hotels (id, agency_id, name, location, latitude, longitude, total_rooms, current_standard_rate, status, channel_manager_provider, channel_manager_api_key, channel_manager_hotel_id, whatsapp_phone)
VALUES 
    (1, 'a0000000-0000-0000-0000-000000000001', 'The Claridges New Delhi', 'Dr APJ Abdul Kalam Rd, New Delhi', 28.599800, 77.218500, 140, 7200.00, 'active', 'ezee_centrix', 'EZ_LIVE_SEC_882910', 'CLARIDGES_ND_01', '+919810123456'),
    (2, 'a0000000-0000-0000-0000-000000000001', 'The Manor New Delhi', 'Friends Colony West, New Delhi', 28.563200, 77.265400, 45, 5900.00, 'active', 'siteminder', 'SM_KEY_LIVE_991823', 'MANOR_DEL_02', '+919810654321')
ON CONFLICT (id) DO UPDATE SET 
    current_standard_rate = EXCLUDED.current_standard_rate,
    status = EXCLUDED.status;

-- 4. Insert Regional Competitors
INSERT INTO competitors (id, agency_id, name, latitude, longitude, star_rating, baseline_adr, review_score, location_name)
VALUES 
    (101, 'a0000000-0000-0000-0000-000000000001', 'The Imperial New Delhi', 28.623900, 77.218800, 5, 11500.00, 9.2, 'Janpath, Connaught Place'),
    (102, 'a0000000-0000-0000-0000-000000000001', 'The Lodhi New Delhi', 28.593400, 77.238400, 5, 13200.00, 9.4, 'Lodhi Road, Pragati Vihar'),
    (103, 'a0000000-0000-0000-0000-000000000001', 'The Oberoi New Delhi', 28.598900, 77.239200, 5, 14500.00, 9.6, 'Dr Zakir Hussain Marg'),
    (104, 'a0000000-0000-0000-0000-000000000001', 'Taj Mahal Hotel (Number One Mansingh)', 28.604700, 77.224800, 5, 12000.00, 9.1, 'Mansingh Road'),
    (105, 'a0000000-0000-0000-0000-000000000001', 'Bloomrooms @ Janpath', 28.625100, 77.217800, 3, 4200.00, 8.3, 'Janpath Lane')
ON CONFLICT (id) DO NOTHING;

-- 5. Associate Active Comp-Set for The Claridges (Hotel ID 1)
INSERT INTO comp_sets (hotel_id, competitor_id, is_active, updated_at)
VALUES 
    (1, 101, TRUE, CURRENT_TIMESTAMP),
    (1, 102, TRUE, CURRENT_TIMESTAMP),
    (1, 103, TRUE, CURRENT_TIMESTAMP),
    (1, 104, TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (hotel_id, competitor_id) DO UPDATE SET is_active = TRUE;

-- 6. Insert Local Demand Driver Events (NCR Exhibition Centers & Arenas)
INSERT INTO events (id, agency_id, name, event_date, venue_name, latitude, longitude, expected_attendance, category)
VALUES 
    (1, 'a0000000-0000-0000-0000-000000000001', 'Global AI & Cloud Tech Expo 2026', CURRENT_DATE + INTERVAL '7 days', 'Bharat Mandapam (Pragati Maidan)', 28.618400, 77.241500, 42000, 'Exhibition / Tech Conference'),
    (2, 'a0000000-0000-0000-0000-000000000001', 'Coldplay World Tour Live In Delhi', CURRENT_DATE + INTERVAL '14 days', 'Jawaharlal Nehru Stadium', 28.582800, 77.234400, 55000, 'Concert / Mega Music'),
    (3, 'a0000000-0000-0000-0000-000000000001', 'Indo-Global Medical Devices Summit', CURRENT_DATE + INTERVAL '21 days', 'Yashobhoomi Convention Centre (IICC)', 28.552400, 77.058300, 28000, 'Medical Expo'),
    (4, 'a0000000-0000-0000-0000-000000000001', 'Auto Expo Bharat Mobility 2026', CURRENT_DATE + INTERVAL '28 days', 'Bharat Mandapam (Pragati Maidan)', 28.618400, 77.241500, 68000, 'Trade Exhibition')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Historical & Observed Competitor Rates
INSERT INTO rates (agency_id, entity_type, entity_id, stay_date, room_type, raw_room_name, normalized_room_type, rate, source_channel, observed_at, observation_date)
VALUES 
    -- Hotel Current Rates
    ('a0000000-0000-0000-0000-000000000001', 'hotel', 1, CURRENT_DATE + INTERVAL '7 days', 'Standard', 'Deluxe Room Queen Bed', 'Standard', 7200.00, 'Agoda', CURRENT_TIMESTAMP, CURRENT_DATE),
    ('a0000000-0000-0000-0000-000000000001', 'hotel', 1, CURRENT_DATE + INTERVAL '7 days', 'Deluxe', 'Heritage Wing King Bed', 'Deluxe', 8500.00, 'Booking.com', CURRENT_TIMESTAMP, CURRENT_DATE),
    -- The Imperial (Competitor 101)
    ('a0000000-0000-0000-0000-000000000001', 'competitor', 101, CURRENT_DATE + INTERVAL '7 days', 'Standard', 'Heritage Classic Double', 'Standard', 9800.00, 'Agoda', CURRENT_TIMESTAMP, CURRENT_DATE),
    ('a0000000-0000-0000-0000-000000000001', 'competitor', 101, CURRENT_DATE + INTERVAL '7 days', 'Deluxe', 'Grand Heritage Room', 'Deluxe', 11900.00, 'Booking.com', CURRENT_TIMESTAMP, CURRENT_DATE),
    -- The Lodhi (Competitor 102)
    ('a0000000-0000-0000-0000-000000000001', 'competitor', 102, CURRENT_DATE + INTERVAL '7 days', 'Standard', 'Lodhi Room with Private Plunge Pool', 'Deluxe', 12500.00, 'Booking.com', CURRENT_TIMESTAMP, CURRENT_DATE),
    ('a0000000-0000-0000-0000-000000000001', 'competitor', 102, CURRENT_DATE + INTERVAL '7 days', 'Standard', 'Lodhi Executive Suite', 'Executive', 14800.00, 'MakeMyTrip', CURRENT_TIMESTAMP, CURRENT_DATE),
    -- The Oberoi (Competitor 103)
    ('a0000000-0000-0000-0000-000000000001', 'competitor', 103, CURRENT_DATE + INTERVAL '7 days', 'Standard', 'Deluxe Golf View Room', 'Deluxe', 13900.00, 'Agoda', CURRENT_TIMESTAMP, CURRENT_DATE),
    -- Taj Mahal Hotel (Competitor 104)
    ('a0000000-0000-0000-0000-000000000001', 'competitor', 104, CURRENT_DATE + INTERVAL '7 days', 'Standard', 'Superior City View King', 'Standard', 10200.00, 'MakeMyTrip', CURRENT_TIMESTAMP, CURRENT_DATE)
ON CONFLICT ON CONSTRAINT uq_rate_observation DO UPDATE SET rate = EXCLUDED.rate;

-- 8. Insert Active AI Recommendation
INSERT INTO recommendations (id, agency_id, hotel_id, stay_date, current_rate, recommended_rate, model_confidence, explanation_text, status, created_at, updated_at)
VALUES 
    (1, 'a0000000-0000-0000-0000-000000000001', 1, CURRENT_DATE + INTERVAL '7 days', 7200.00, 8950.00, 0.94, 'Global AI & Cloud Tech Expo (42,000 attendees) at Bharat Mandapam (2.1 km away) has driven competitor median to ₹10,850. With internal occupancy at 68% and booking velocity up 3.2x, increasing rate to ₹8,950 captures ₹2.45L additional RevPAR without stalling conversion.', 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence numbers to maintain serial integrity
SELECT setval(pg_get_serial_sequence('hotels', 'id'), COALESCE(MAX(id), 1)) FROM hotels;
SELECT setval(pg_get_serial_sequence('competitors', 'id'), COALESCE(MAX(id), 1)) FROM competitors;
SELECT setval(pg_get_serial_sequence('events', 'id'), COALESCE(MAX(id), 1)) FROM events;
SELECT setval(pg_get_serial_sequence('recommendations', 'id'), COALESCE(MAX(id), 1)) FROM recommendations;
