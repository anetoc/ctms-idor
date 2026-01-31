-- Migration: 008_monitor_letters.sql
-- Description: Create monitor_letters table for CTMS IDOR
-- Created: 2026-01-30
-- PostgreSQL 16
-- Dependencies: 001_enums.sql, 003_studies.sql

BEGIN;

CREATE TABLE monitor_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID NOT NULL,
    visit_date DATE,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    letter_type monitor_letter_type NOT NULL DEFAULT 'routine',
    file_path VARCHAR(1000),
    raw_content TEXT,
    processed BOOLEAN NOT NULL DEFAULT false,
    processing_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_monitor_letters_study
        FOREIGN KEY (study_id)
        REFERENCES studies(id)
        ON DELETE CASCADE
);

-- Index for study-based lookups
CREATE INDEX idx_monitor_letters_study_id ON monitor_letters (study_id);

-- Index for processing queue
CREATE INDEX idx_monitor_letters_unprocessed ON monitor_letters (created_at)
    WHERE processed = false;

-- Index for visit date ordering
CREATE INDEX idx_monitor_letters_visit_date ON monitor_letters (study_id, visit_date DESC);

-- Now add the foreign key from action_items to monitor_letters
ALTER TABLE action_items
    ADD CONSTRAINT fk_action_items_monitor_letter
    FOREIGN KEY (monitor_letter_id)
    REFERENCES monitor_letters(id)
    ON DELETE SET NULL;

COMMENT ON TABLE monitor_letters IS 'Monitor visit letters received for processing';
COMMENT ON COLUMN monitor_letters.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN monitor_letters.study_id IS 'Reference to the study';
COMMENT ON COLUMN monitor_letters.visit_date IS 'Date of the monitoring visit';
COMMENT ON COLUMN monitor_letters.received_at IS 'When the letter was received/uploaded';
COMMENT ON COLUMN monitor_letters.letter_type IS 'Type of monitoring visit';
COMMENT ON COLUMN monitor_letters.file_path IS 'Path to the original file';
COMMENT ON COLUMN monitor_letters.raw_content IS 'Extracted text content for processing';
COMMENT ON COLUMN monitor_letters.processed IS 'Whether AI extraction has been completed';
COMMENT ON COLUMN monitor_letters.processing_error IS 'Error message if processing failed';

COMMIT;
