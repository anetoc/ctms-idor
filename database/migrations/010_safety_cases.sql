-- Migration: 010_safety_cases.sql
-- Description: Create safety_cases table for CTMS IDOR
-- Created: 2026-01-30
-- PostgreSQL 16
-- Dependencies: 001_enums.sql, 003_studies.sql

BEGIN;

-- Safety case status
CREATE TYPE safety_case_status AS ENUM (
    'open',
    'submitted',
    'acknowledged',
    'closed',
    'overdue'
);

COMMENT ON TYPE safety_case_status IS 'Status of safety case processing';

CREATE TABLE safety_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID NOT NULL,
    case_number VARCHAR(100) NOT NULL,
    case_type safety_case_type NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deadline TIMESTAMPTZ,
    status safety_case_status NOT NULL DEFAULT 'open',
    portal_source VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_safety_cases_study
        FOREIGN KEY (study_id)
        REFERENCES studies(id)
        ON DELETE CASCADE,

    CONSTRAINT safety_cases_case_number_unique UNIQUE (case_number)
);

-- Index for study-based lookups
CREATE INDEX idx_safety_cases_study_id ON safety_cases (study_id);

-- Index for deadline monitoring (critical for compliance)
CREATE INDEX idx_safety_cases_deadline ON safety_cases (deadline)
    WHERE status NOT IN ('closed', 'acknowledged');

-- Index for open cases
CREATE INDEX idx_safety_cases_open ON safety_cases (study_id, case_type)
    WHERE status IN ('open', 'submitted');

-- Index for case number lookups
CREATE INDEX idx_safety_cases_case_number ON safety_cases (case_number);

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_safety_cases_updated_at
    BEFORE UPDATE ON safety_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE safety_cases IS 'Safety cases (SUSAR, SAE, AE) for compliance tracking';
COMMENT ON COLUMN safety_cases.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN safety_cases.study_id IS 'Reference to the study';
COMMENT ON COLUMN safety_cases.case_number IS 'Unique case identifier';
COMMENT ON COLUMN safety_cases.case_type IS 'Type of safety case (SUSAR, SAE, AE)';
COMMENT ON COLUMN safety_cases.received_at IS 'When the case was received';
COMMENT ON COLUMN safety_cases.deadline IS 'Reporting deadline';
COMMENT ON COLUMN safety_cases.status IS 'Current processing status';
COMMENT ON COLUMN safety_cases.portal_source IS 'Source portal/system';
COMMENT ON COLUMN safety_cases.notes IS 'Additional notes';

COMMIT;
