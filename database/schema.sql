-- ==============================================================================
-- AI HOTEL REVENUE INTELLIGENCE PLATFORM & WHATSAPP COPILOT (AMS)
-- DATABASE DDL SCHEMAS & PL/pgSQL STORED PROCEDURES (NEON SERVERLESS POSTGRESQL)
-- Multi-Tenancy Architecture with Row-Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension for cryptographic multi-tenant keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing structures for idempotent migration runs if necessary
-- DROP TABLE IF EXISTS recommendations CASCADE;
-- DROP TABLE IF EXISTS rates CASCADE;
-- DROP TABLE IF EXISTS comp_sets CASCADE;
-- DROP TABLE IF EXISTS competitors CASCADE;
-- DROP TABLE IF EXISTS events CASCADE;
-- DROP TABLE IF EXISTS hotels CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS agencies CASCADE;

-- ------------------------------------------------------------------------------
-- 1. AGENCIES (Multi-Tenant Root: Revenue Management Agencies & Single Hoteliers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. USERS (Agency Managers, Hotel Revenue Operators, Single Owners)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('agency_admin', 'revenue_manager', 'hotel_owner', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. HOTELS (Client Properties Managed under an Agency)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hotels (
    id SERIAL PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    total_rooms INT NOT NULL CHECK (total_rooms > 0),
    current_standard_rate DECIMAL(10,2) NOT NULL CHECK (current_standard_rate >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'onboarding')),
    channel_manager_provider VARCHAR(50) DEFAULT 'ezee_centrix' CHECK (channel_manager_provider IN ('ezee_centrix', 'siteminder', 'staah', 'rate_gain')),
    channel_manager_api_key VARCHAR(255),
    channel_manager_hotel_id VARCHAR(100),
    whatsapp_phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. COMPETITORS (Comp-Set Entities Tracked Across OTAs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS competitors (
    id SERIAL PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    star_rating INT CHECK (star_rating BETWEEN 1 AND 5),
    baseline_adr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    review_score DECIMAL(3,2) CHECK (review_score BETWEEN 0.0 AND 10.0),
    location_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. COMP_SETS (Active Association Between Hotel and Competitors)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comp_sets (
    hotel_id INT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    competitor_id INT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (hotel_id, competitor_id)
);

-- ------------------------------------------------------------------------------
-- 6. RATES (Historical & Live Scraping Telemetry across Agoda, Booking.com, MMT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rates (
    id BIGSERIAL PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    entity_type VARCHAR(10) NOT NULL CHECK (entity_type IN ('hotel', 'competitor')),
    entity_id INT NOT NULL,
    stay_date DATE NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    raw_room_name VARCHAR(150),
    normalized_room_type VARCHAR(50) NOT NULL CHECK (normalized_room_type IN ('Standard', 'Deluxe', 'Executive', 'Suite')),
    rate DECIMAL(10,2) NOT NULL CHECK (rate >= 0),
    source_channel VARCHAR(30) DEFAULT 'Agoda' NOT NULL,
    observed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    observation_date DATE DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT uq_rate_observation UNIQUE (entity_type, entity_id, stay_date, normalized_room_type, source_channel, observation_date)
);

-- ------------------------------------------------------------------------------
-- 7. EVENTS (Local Happenings, Concerts, Expo Center Exhibitions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE, -- NULL indicates global/regional event accessible to all
    name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    venue_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    expected_attendance INT DEFAULT 0,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_event_entry UNIQUE (name, event_date, venue_name)
);

-- ------------------------------------------------------------------------------
-- 8. RECOMMENDATIONS (AI Econometric Pricing Directives & WhatsApp State)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    hotel_id INT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    stay_date DATE NOT NULL,
    current_rate DECIMAL(10,2) NOT NULL,
    recommended_rate DECIMAL(10,2) NOT NULL,
    model_confidence DECIMAL(3,2) NOT NULL CHECK (model_confidence BETWEEN 0.00 AND 1.00),
    explanation_text TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- INDEXES OPTIMIZED FOR NEON SERVERLESS QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_agency ON users(agency_id);
CREATE INDEX IF NOT EXISTS idx_hotels_agency ON hotels(agency_id);
CREATE INDEX IF NOT EXISTS idx_competitors_agency ON competitors(agency_id);
CREATE INDEX IF NOT EXISTS idx_comp_sets_hotel ON comp_sets(hotel_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_rates_query ON rates(entity_type, entity_id, stay_date);
CREATE INDEX IF NOT EXISTS idx_rates_agency_stay ON rates(agency_id, stay_date);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_recs_hotel_date ON recommendations(hotel_id, stay_date);
CREATE INDEX IF NOT EXISTS idx_recs_status ON recommendations(status);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Uses session configuration: current_setting('app.current_agency_id', true)::uuid
-- ==============================================================================
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE comp_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Helper to retrieve current tenant safely
CREATE OR REPLACE FUNCTION current_app_agency() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_agency_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 1. Agencies Policy
CREATE POLICY agency_isolation_policy ON agencies
    FOR ALL
    USING (id = current_app_agency() OR current_app_agency() IS NULL);

-- 2. Users Policy
CREATE POLICY users_isolation_policy ON users
    FOR ALL
    USING (agency_id = current_app_agency() OR current_app_agency() IS NULL);

-- 3. Hotels Policy
CREATE POLICY hotels_isolation_policy ON hotels
    FOR ALL
    USING (agency_id = current_app_agency() OR current_app_agency() IS NULL);

-- 4. Competitors Policy
CREATE POLICY competitors_isolation_policy ON competitors
    FOR ALL
    USING (agency_id = current_app_agency() OR current_app_agency() IS NULL);

-- 5. Comp Sets Policy (Derived through hotel's agency)
CREATE POLICY comp_sets_isolation_policy ON comp_sets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM hotels h
            WHERE h.id = comp_sets.hotel_id
            AND (h.agency_id = current_app_agency() OR current_app_agency() IS NULL)
        )
    );

-- 6. Rates Policy
CREATE POLICY rates_isolation_policy ON rates
    FOR ALL
    USING (agency_id = current_app_agency() OR current_app_agency() IS NULL);

-- 7. Events Policy (Shared global events agency_id IS NULL OR matching agency)
CREATE POLICY events_isolation_policy ON events
    FOR ALL
    USING (agency_id = current_app_agency() OR agency_id IS NULL OR current_app_agency() IS NULL);

-- 8. Recommendations Policy
CREATE POLICY recommendations_isolation_policy ON recommendations
    FOR ALL
    USING (agency_id = current_app_agency() OR current_app_agency() IS NULL);

-- ==============================================================================
-- PL/pgSQL STORED PROCEDURES (TRANSACTIONAL CHEF PATTERN)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Procedure 1: update_comp_set(p_hotel_id INT, p_competitor_ids INT[])
-- Manages dynamic competitor set updates: disables inactive competitors,
-- upserts newly selected competitors, logs update timestamp, and preserves history.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_comp_set(
    p_hotel_id INT,
    p_competitor_ids INT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_hotel_exists BOOLEAN;
    v_deactivated_count INT := 0;
    v_activated_count INT := 0;
    v_cid INT;
BEGIN
    -- Verify hotel existence and RLS context
    SELECT EXISTS (
        SELECT 1 FROM hotels
        WHERE id = p_hotel_id
        AND (agency_id = current_app_agency() OR current_app_agency() IS NULL)
    ) INTO v_hotel_exists;

    IF NOT v_hotel_exists THEN
        RAISE EXCEPTION 'Hotel with ID % not found or unauthorized for current agency', p_hotel_id;
    END IF;

    -- Deactivate competitors not present in incoming list (preserves historical telemetry)
    UPDATE comp_sets
    SET is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP
    WHERE hotel_id = p_hotel_id
      AND is_active = TRUE
      AND competitor_id != ALL(p_competitor_ids);
      
    GET DIAGNOSTICS v_deactivated_count = ROW_COUNT;

    -- Upsert incoming competitor IDs into the comp set
    IF p_competitor_ids IS NOT NULL AND array_length(p_competitor_ids, 1) > 0 THEN
        FOREACH v_cid IN ARRAY p_competitor_ids LOOP
            INSERT INTO comp_sets (hotel_id, competitor_id, is_active, updated_at)
            VALUES (p_hotel_id, v_cid, TRUE, CURRENT_TIMESTAMP)
            ON CONFLICT (hotel_id, competitor_id)
            DO UPDATE SET
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP;
                
            v_activated_count := v_activated_count + 1;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'status', 'success',
        'hotel_id', p_hotel_id,
        'active_competitors_count', v_activated_count,
        'deactivated_competitors_count', v_deactivated_count,
        'timestamp', CURRENT_TIMESTAMP
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- Procedure 2: insert_rate_observation(...)
-- Ingests freshly scraped room prices using ON CONFLICT logic to prevent duplicates
-- for the same entity, stay_date, normalized_room_type, and observation window.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION insert_rate_observation(
    p_agency_id UUID,
    p_entity_type VARCHAR(10),
    p_entity_id INT,
    p_stay_date DATE,
    p_room_type VARCHAR(50),
    p_raw_room_name VARCHAR(150),
    p_normalized_room_type VARCHAR(50),
    p_rate DECIMAL(10,2),
    p_source_channel VARCHAR(30) DEFAULT 'Agoda',
    p_observed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rate_id BIGINT;
    v_agency UUID;
BEGIN
    -- Fallback to active session agency if null passed
    v_agency := COALESCE(p_agency_id, current_app_agency());
    
    IF v_agency IS NULL THEN
        -- If entity is hotel, derive agency from hotel record
        IF p_entity_type = 'hotel' THEN
            SELECT agency_id INTO v_agency FROM hotels WHERE id = p_entity_id;
        ELSE
            SELECT agency_id INTO v_agency FROM competitors WHERE id = p_entity_id;
        END IF;
    END IF;

    IF v_agency IS NULL THEN
        RAISE EXCEPTION 'Cannot resolve agency_id for rate observation insert';
    END IF;

    INSERT INTO rates (
        agency_id,
        entity_type,
        entity_id,
        stay_date,
        room_type,
        raw_room_name,
        normalized_room_type,
        rate,
        source_channel,
        observed_at,
        observation_date
    )
    VALUES (
        v_agency,
        p_entity_type,
        p_entity_id,
        p_stay_date,
        p_room_type,
        p_raw_room_name,
        p_normalized_room_type,
        p_rate,
        COALESCE(p_source_channel, 'Agoda'),
        COALESCE(p_observed_at, CURRENT_TIMESTAMP),
        CURRENT_DATE
    )
    ON CONFLICT (entity_type, entity_id, stay_date, normalized_room_type, source_channel, observation_date)
    DO UPDATE SET
        rate = EXCLUDED.rate,
        raw_room_name = EXCLUDED.raw_room_name,
        observed_at = EXCLUDED.observed_at
    RETURNING id INTO v_rate_id;

    RETURN v_rate_id;
END;
$$;

-- ------------------------------------------------------------------------------
-- Procedure 3: approve_recommendation(p_rec_id INT)
-- Approves pending rate directive, updates timestamps, and returns PMS
-- credentials payload for downstream Channel Manager distribution.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION approve_recommendation(
    p_rec_id INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rec RECORD;
    v_hotel RECORD;
    v_payload JSONB;
BEGIN
    -- Retrieve recommendation record
    SELECT * INTO v_rec
    FROM recommendations
    WHERE id = p_rec_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recommendation with ID % not found', p_rec_id;
    END IF;

    IF v_rec.status = 'Approved' THEN
        RETURN jsonb_build_object(
            'status', 'already_approved',
            'message', 'Recommendation has already been approved and synced.',
            'recommendation_id', p_rec_id
        );
    END IF;

    -- Fetch Hotel Channel Manager configuration
    SELECT id, name, channel_manager_provider, channel_manager_api_key, channel_manager_hotel_id, whatsapp_phone
    INTO v_hotel
    FROM hotels
    WHERE id = v_rec.hotel_id;

    -- Update recommendation status to Approved
    UPDATE recommendations
    SET status = 'Approved',
        applied_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_rec_id;

    -- Update standard rate on the hotel master
    UPDATE hotels
    SET current_standard_rate = v_rec.recommended_rate
    WHERE id = v_rec.hotel_id;

    -- Build downstream routing payload
    v_payload := jsonb_build_object(
        'status', 'success',
        'recommendation_id', v_rec.id,
        'hotel_id', v_hotel.id,
        'hotel_name', v_hotel.name,
        'target_date', v_rec.stay_date,
        'previous_rate', v_rec.current_rate,
        'new_rate', v_rec.recommended_rate,
        'currency', 'INR',
        'applied_at', CURRENT_TIMESTAMP,
        'whatsapp_phone', v_hotel.whatsapp_phone,
        'pms_channel_manager', jsonb_build_object(
            'provider', COALESCE(v_hotel.channel_manager_provider, 'ezee_centrix'),
            'api_key', COALESCE(v_hotel.channel_manager_api_key, 'EZ_TEST_LIVE_KEY_8892'),
            'hotel_code', COALESCE(v_hotel.channel_manager_hotel_id, 'IND_DEL_1092')
        )
    );

    RETURN v_payload;
END;
$$;
