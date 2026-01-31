-- Migration: 004_study_team.sql
-- Description: Create study_team table for CTMS IDOR
-- Created: 2026-01-30
-- PostgreSQL 16
-- Dependencies: 002_users.sql, 003_studies.sql

BEGIN;

-- Team role within a study (different from system user_role)
CREATE TYPE study_team_role AS ENUM (
    'sc_lead',
    'coordinator',
    'data_manager',
    'sub_investigator',
    'pharmacist',
    'nurse',
    'regulatory',
    'quality',
    'other'
);

COMMENT ON TYPE study_team_role IS 'Role of a team member within a specific study';

CREATE TABLE study_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role study_team_role NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_study_team_study
        FOREIGN KEY (study_id)
        REFERENCES studies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_study_team_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT study_team_unique_member
        UNIQUE (study_id, user_id)
);

-- Index for study team lookups
CREATE INDEX idx_study_team_study_id ON study_team (study_id);

-- Index for user's studies
CREATE INDEX idx_study_team_user_id ON study_team (user_id);

-- Index for finding primary contacts
CREATE INDEX idx_study_team_primary ON study_team (study_id, role) WHERE is_primary = true;

COMMENT ON TABLE study_team IS 'Team members assigned to each study';
COMMENT ON COLUMN study_team.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN study_team.study_id IS 'Reference to the study';
COMMENT ON COLUMN study_team.user_id IS 'Reference to the user';
COMMENT ON COLUMN study_team.role IS 'Role within this specific study';
COMMENT ON COLUMN study_team.is_primary IS 'Whether this is the primary contact for this role';

COMMIT;
