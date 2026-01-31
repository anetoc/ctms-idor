-- Migration: 011_agent_runs.sql
-- Description: Create agent_runs table for Moltbolt RPA audit
-- Created: 2026-01-30
-- PostgreSQL 16
-- Dependencies: 001_enums.sql

BEGIN;

CREATE TABLE agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(100) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status agent_run_status NOT NULL DEFAULT 'pending',
    items_extracted INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT agent_runs_items_positive CHECK (items_extracted >= 0),
    CONSTRAINT agent_runs_completed_after_started CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- Index for agent filtering
CREATE INDEX idx_agent_runs_agent_name ON agent_runs (agent_name);

-- Index for job type filtering
CREATE INDEX idx_agent_runs_job_type ON agent_runs (job_type);

-- Index for status monitoring
CREATE INDEX idx_agent_runs_status ON agent_runs (status)
    WHERE status IN ('pending', 'running');

-- Index for chronological queries
CREATE INDEX idx_agent_runs_started_at ON agent_runs (started_at DESC);

-- Composite index for agent history
CREATE INDEX idx_agent_runs_agent_history ON agent_runs (agent_name, started_at DESC);

-- Index for failed runs (for debugging)
CREATE INDEX idx_agent_runs_failed ON agent_runs (agent_name, started_at DESC)
    WHERE status = 'failed';

COMMENT ON TABLE agent_runs IS 'Audit trail for RPA/agent job executions';
COMMENT ON COLUMN agent_runs.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN agent_runs.agent_name IS 'Name of the agent/bot';
COMMENT ON COLUMN agent_runs.job_type IS 'Type of job executed';
COMMENT ON COLUMN agent_runs.started_at IS 'When the job started';
COMMENT ON COLUMN agent_runs.completed_at IS 'When the job completed (null if still running)';
COMMENT ON COLUMN agent_runs.status IS 'Current job status';
COMMENT ON COLUMN agent_runs.items_extracted IS 'Number of items processed/extracted';
COMMENT ON COLUMN agent_runs.error_message IS 'Error details if failed';
COMMENT ON COLUMN agent_runs.metadata IS 'Additional job-specific data (JSON)';

COMMIT;
