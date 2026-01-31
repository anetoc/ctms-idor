-- Migration: 006_action_item_updates.sql
-- Description: Create action_item_updates table for audit trail
-- Created: 2026-01-30
-- PostgreSQL 16
-- Dependencies: 002_users.sql, 005_action_items.sql

BEGIN;

CREATE TABLE action_item_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_item_id UUID NOT NULL,
    user_id UUID NOT NULL,
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_action_item_updates_action_item
        FOREIGN KEY (action_item_id)
        REFERENCES action_items(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_action_item_updates_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- Index for action item history lookups
CREATE INDEX idx_action_item_updates_action_item_id ON action_item_updates (action_item_id);

-- Index for chronological ordering
CREATE INDEX idx_action_item_updates_created_at ON action_item_updates (action_item_id, created_at DESC);

-- Index for user activity tracking
CREATE INDEX idx_action_item_updates_user_id ON action_item_updates (user_id);

COMMENT ON TABLE action_item_updates IS 'Audit trail for action item changes';
COMMENT ON COLUMN action_item_updates.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN action_item_updates.action_item_id IS 'Reference to the action item';
COMMENT ON COLUMN action_item_updates.user_id IS 'User who made the change';
COMMENT ON COLUMN action_item_updates.field_changed IS 'Name of field that was changed (null for comments only)';
COMMENT ON COLUMN action_item_updates.old_value IS 'Previous value (serialized as text)';
COMMENT ON COLUMN action_item_updates.new_value IS 'New value (serialized as text)';
COMMENT ON COLUMN action_item_updates.comment IS 'Optional comment about the change';

COMMIT;
