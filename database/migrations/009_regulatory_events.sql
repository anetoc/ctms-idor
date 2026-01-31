-- Migration: 009_regulatory_events.sql
-- Description: Create regulatory_events table for CTMS IDOR
-- Created: 2026-01-30
-- PostgreSQL 16
-- Dependencies: 001_enums.sql, 002_users.sql, 003_studies.sql

BEGIN;

CREATE TABLE regulatory_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID NOT NULL,
    event_type regulatory_event_type NOT NULL,
    event_date DATE NOT NULL,
    submission_date DATE,
    approval_date DATE,
    notes TEXT,
    document_path VARCHAR(1000),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_regulatory_events_study
        FOREIGN KEY (study_id)
        REFERENCES studies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_regulatory_events_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT regulatory_events_approval_after_submission
        CHECK (approval_date IS NULL OR submission_date IS NULL OR approval_date >= submission_date)
);

-- Index for study-based lookups
CREATE INDEX idx_regulatory_events_study_id ON regulatory_events (study_id);

-- Index for event type filtering
CREATE INDEX idx_regulatory_events_event_type ON regulatory_events (event_type);

-- Composite index for study timeline queries
CREATE INDEX idx_regulatory_events_study_timeline ON regulatory_events (study_id, event_date DESC);

-- Index for pending approvals (submitted but not approved)
CREATE INDEX idx_regulatory_events_pending ON regulatory_events (study_id, event_type)
    WHERE submission_date IS NOT NULL AND approval_date IS NULL;

COMMENT ON TABLE regulatory_events IS 'Regulatory milestones and events for each study';
COMMENT ON COLUMN regulatory_events.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN regulatory_events.study_id IS 'Reference to the study';
COMMENT ON COLUMN regulatory_events.event_type IS 'Type of regulatory event';
COMMENT ON COLUMN regulatory_events.event_date IS 'Date of the event';
COMMENT ON COLUMN regulatory_events.submission_date IS 'Date submitted to regulatory body';
COMMENT ON COLUMN regulatory_events.approval_date IS 'Date approval was received';
COMMENT ON COLUMN regulatory_events.notes IS 'Additional notes';
COMMENT ON COLUMN regulatory_events.document_path IS 'Path to related document';
COMMENT ON COLUMN regulatory_events.created_by IS 'User who recorded the event';

COMMIT;
