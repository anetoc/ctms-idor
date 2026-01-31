-- Migration: 001_enums.sql
-- Description: Create all ENUM types for CTMS IDOR
-- Created: 2026-01-30
-- PostgreSQL 16

BEGIN;

-- User roles in the system
CREATE TYPE user_role AS ENUM (
    'admin',
    'ops_manager',
    'sc_lead',
    'study_coordinator',
    'data_manager',
    'quality',
    'finance',
    'readonly'
);

COMMENT ON TYPE user_role IS 'Roles for user access control in CTMS';

-- Study lifecycle status
CREATE TYPE study_status AS ENUM (
    'active',
    'closed',
    'suspended',
    'in_startup'
);

COMMENT ON TYPE study_status IS 'Current status of a clinical study';

-- Action item workflow status
CREATE TYPE action_item_status AS ENUM (
    'new',
    'in_progress',
    'waiting_external',
    'done',
    'verified'
);

COMMENT ON TYPE action_item_status IS 'Workflow status for action items';

-- Action item categories (from monitor letters and other sources)
CREATE TYPE action_item_category AS ENUM (
    'regulatory',
    'consent_icf',
    'data_entry',
    'queries',
    'safety_reporting',
    'samples',
    'imaging',
    'pharmacy_ip',
    'training',
    'contracts_budget',
    'other'
);

COMMENT ON TYPE action_item_category IS 'Categories for classifying action items';

-- Severity levels for prioritization
CREATE TYPE severity_level AS ENUM (
    'critical',
    'major',
    'minor',
    'info'
);

COMMENT ON TYPE severity_level IS 'Severity levels for action items and issues';

-- Regulatory event types
CREATE TYPE regulatory_event_type AS ENUM (
    'package_received',
    'cep_submission',
    'cep_approval',
    'amendment',
    'annual_report'
);

COMMENT ON TYPE regulatory_event_type IS 'Types of regulatory events tracked';

-- Monitor letter types
CREATE TYPE monitor_letter_type AS ENUM (
    'routine',
    'for_cause',
    'closeout'
);

COMMENT ON TYPE monitor_letter_type IS 'Types of monitoring visits/letters';

-- Safety case types
CREATE TYPE safety_case_type AS ENUM (
    'SUSAR',
    'SAE',
    'AE'
);

COMMENT ON TYPE safety_case_type IS 'Types of safety cases';

-- Agent run status
CREATE TYPE agent_run_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed'
);

COMMENT ON TYPE agent_run_status IS 'Status of agent/RPA job runs';

COMMIT;
