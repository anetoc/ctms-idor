-- Migration: 003_studies.sql
-- Description: Create studies table for CTMS IDOR
-- Created: 2026-01-30
-- PostgreSQL 16
-- Dependencies: 001_enums.sql

BEGIN;

CREATE TABLE studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_number VARCHAR(100) NOT NULL,
    short_name VARCHAR(100) NOT NULL,
    full_title VARCHAR(1000) NOT NULL,
    sponsor VARCHAR(255) NOT NULL,
    phase VARCHAR(20),
    therapeutic_area VARCHAR(255),
    status study_status NOT NULL DEFAULT 'in_startup',
    enrollment_target INTEGER,
    current_enrollment INTEGER NOT NULL DEFAULT 0,
    pi_name VARCHAR(255),
    start_date DATE,
    estimated_end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT studies_protocol_number_unique UNIQUE (protocol_number),
    CONSTRAINT studies_enrollment_positive CHECK (current_enrollment >= 0),
    CONSTRAINT studies_enrollment_target_positive CHECK (enrollment_target IS NULL OR enrollment_target >= 0)
);

-- Index for protocol number lookups
CREATE INDEX idx_studies_protocol_number ON studies (protocol_number);

-- Index for sponsor filtering
CREATE INDEX idx_studies_sponsor ON studies (sponsor);

-- Index for status filtering (common query)
CREATE INDEX idx_studies_status ON studies (status);

-- Composite index for dashboard queries (active studies by sponsor)
CREATE INDEX idx_studies_status_sponsor ON studies (status, sponsor) WHERE status = 'active';

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_studies_updated_at
    BEFORE UPDATE ON studies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE studies IS 'Clinical studies/trials managed by IDOR';
COMMENT ON COLUMN studies.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN studies.protocol_number IS 'Official protocol number (unique)';
COMMENT ON COLUMN studies.short_name IS 'Short name for display';
COMMENT ON COLUMN studies.full_title IS 'Complete study title';
COMMENT ON COLUMN studies.sponsor IS 'Sponsoring company/organization';
COMMENT ON COLUMN studies.phase IS 'Clinical trial phase (I, II, III, IV, etc.)';
COMMENT ON COLUMN studies.therapeutic_area IS 'Medical/therapeutic area';
COMMENT ON COLUMN studies.status IS 'Current study status';
COMMENT ON COLUMN studies.enrollment_target IS 'Target number of participants';
COMMENT ON COLUMN studies.current_enrollment IS 'Current enrolled participants';
COMMENT ON COLUMN studies.pi_name IS 'Principal Investigator name';
COMMENT ON COLUMN studies.start_date IS 'Study start date';
COMMENT ON COLUMN studies.estimated_end_date IS 'Estimated completion date';

COMMIT;
