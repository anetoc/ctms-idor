-- Migration: 007_sla_rules.sql
-- Description: Create sla_rules table with default rules
-- Created: 2026-01-30
-- PostgreSQL 16
-- Dependencies: 001_enums.sql

BEGIN;

CREATE TABLE sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category action_item_category,
    severity severity_level NOT NULL,
    resolution_hours INTEGER NOT NULL,
    escalation_hours INTEGER NOT NULL,
    escalation_to_role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sla_rules_resolution_positive CHECK (resolution_hours > 0),
    CONSTRAINT sla_rules_escalation_positive CHECK (escalation_hours > 0),
    CONSTRAINT sla_rules_escalation_before_resolution CHECK (escalation_hours < resolution_hours)
);

-- Unique constraint: one rule per category+severity (or severity-only if category is null)
CREATE UNIQUE INDEX idx_sla_rules_unique_with_category
    ON sla_rules (category, severity)
    WHERE category IS NOT NULL AND is_active = true;

CREATE UNIQUE INDEX idx_sla_rules_unique_without_category
    ON sla_rules (severity)
    WHERE category IS NULL AND is_active = true;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_sla_rules_updated_at
    BEFORE UPDATE ON sla_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default SLA rules (based on severity only - category=null means applies to all)
-- Critical: 48h resolution, 24h escalation
INSERT INTO sla_rules (category, severity, resolution_hours, escalation_hours, escalation_to_role) VALUES
    (NULL, 'critical', 48, 24, 'ops_manager');

-- Major: 40h resolution (5 business days), 20h escalation
INSERT INTO sla_rules (category, severity, resolution_hours, escalation_hours, escalation_to_role) VALUES
    (NULL, 'major', 40, 20, 'sc_lead');

-- Minor: 80h resolution (10 business days), 40h escalation
INSERT INTO sla_rules (category, severity, resolution_hours, escalation_hours, escalation_to_role) VALUES
    (NULL, 'minor', 80, 40, 'sc_lead');

-- Info: 120h resolution (15 business days), 80h escalation
INSERT INTO sla_rules (category, severity, resolution_hours, escalation_hours, escalation_to_role) VALUES
    (NULL, 'info', 120, 80, 'sc_lead');

-- Category-specific overrides (examples - safety is more urgent)
INSERT INTO sla_rules (category, severity, resolution_hours, escalation_hours, escalation_to_role) VALUES
    ('safety_reporting', 'critical', 24, 8, 'ops_manager'),
    ('safety_reporting', 'major', 24, 12, 'ops_manager'),
    ('regulatory', 'critical', 24, 12, 'ops_manager');

COMMENT ON TABLE sla_rules IS 'SLA rules for action item deadlines and escalations';
COMMENT ON COLUMN sla_rules.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN sla_rules.category IS 'Action item category (null = applies to all categories)';
COMMENT ON COLUMN sla_rules.severity IS 'Severity level this rule applies to';
COMMENT ON COLUMN sla_rules.resolution_hours IS 'Hours allowed for resolution';
COMMENT ON COLUMN sla_rules.escalation_hours IS 'Hours before escalation';
COMMENT ON COLUMN sla_rules.escalation_to_role IS 'Role to escalate to';
COMMENT ON COLUMN sla_rules.is_active IS 'Whether this rule is currently active';

COMMIT;
