-- Migration: 005_action_items.sql
-- Description: Create action_items table for CTMS IDOR
-- Created: 2026-01-30
-- PostgreSQL 16
-- Dependencies: 001_enums.sql, 002_users.sql, 003_studies.sql

BEGIN;

CREATE TABLE action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID NOT NULL,
    monitor_letter_id UUID,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category action_item_category NOT NULL DEFAULT 'other',
    severity severity_level NOT NULL DEFAULT 'minor',
    status action_item_status NOT NULL DEFAULT 'new',
    assigned_to UUID,
    created_by UUID NOT NULL,
    due_date TIMESTAMPTZ,
    sla_deadline TIMESTAMPTZ,
    escalation_level INTEGER NOT NULL DEFAULT 0,
    resolved_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_action_items_study
        FOREIGN KEY (study_id)
        REFERENCES studies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_action_items_assigned_to
        FOREIGN KEY (assigned_to)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_action_items_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_action_items_verified_by
        FOREIGN KEY (verified_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT action_items_escalation_positive CHECK (escalation_level >= 0),
    CONSTRAINT action_items_resolved_after_created CHECK (resolved_at IS NULL OR resolved_at >= created_at),
    CONSTRAINT action_items_verified_after_resolved CHECK (verified_at IS NULL OR (resolved_at IS NOT NULL AND verified_at >= resolved_at))
);

-- Index for study-based queries (most common)
CREATE INDEX idx_action_items_study_id ON action_items (study_id);

-- Index for user assignments
CREATE INDEX idx_action_items_assigned_to ON action_items (assigned_to) WHERE status NOT IN ('done', 'verified');

-- Index for status filtering
CREATE INDEX idx_action_items_status ON action_items (status);

-- Index for category filtering
CREATE INDEX idx_action_items_category ON action_items (category);

-- Index for severity filtering
CREATE INDEX idx_action_items_severity ON action_items (severity);

-- Index for SLA monitoring (critical for dashboard)
CREATE INDEX idx_action_items_sla_deadline ON action_items (sla_deadline)
    WHERE status NOT IN ('done', 'verified') AND sla_deadline IS NOT NULL;

-- Composite index for dashboard queries (open items by severity)
CREATE INDEX idx_action_items_open_by_severity ON action_items (severity, sla_deadline)
    WHERE status NOT IN ('done', 'verified');

-- Index for monitor letter correlation
CREATE INDEX idx_action_items_monitor_letter ON action_items (monitor_letter_id)
    WHERE monitor_letter_id IS NOT NULL;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_action_items_updated_at
    BEFORE UPDATE ON action_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE action_items IS 'Action items from monitor letters and other sources';
COMMENT ON COLUMN action_items.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN action_items.study_id IS 'Reference to the study';
COMMENT ON COLUMN action_items.monitor_letter_id IS 'Reference to source monitor letter (if applicable)';
COMMENT ON COLUMN action_items.title IS 'Brief title of the action item';
COMMENT ON COLUMN action_items.description IS 'Detailed description';
COMMENT ON COLUMN action_items.category IS 'Category for classification';
COMMENT ON COLUMN action_items.severity IS 'Severity level for prioritization';
COMMENT ON COLUMN action_items.status IS 'Current workflow status';
COMMENT ON COLUMN action_items.assigned_to IS 'User responsible for resolution';
COMMENT ON COLUMN action_items.created_by IS 'User who created the item';
COMMENT ON COLUMN action_items.due_date IS 'Target completion date';
COMMENT ON COLUMN action_items.sla_deadline IS 'SLA-calculated deadline';
COMMENT ON COLUMN action_items.escalation_level IS 'Current escalation level (0=none)';
COMMENT ON COLUMN action_items.resolved_at IS 'When marked as done';
COMMENT ON COLUMN action_items.verified_at IS 'When verified by QA/lead';
COMMENT ON COLUMN action_items.verified_by IS 'User who verified';

COMMIT;
