-- ==============================================================================
-- Migration: Reject Handling and Archived Reason
-- Adds archived_reason column and aligns lifecycle_status and is_archived for rejected tenders
-- ==============================================================================

ALTER TABLE tenders ADD COLUMN IF NOT EXISTS archived_reason VARCHAR(64);

-- Align existing rejected tenders
UPDATE tenders
SET
    lifecycle_status = 'REJECTED',
    is_archived = true,
    archived_reason = 'AI_REJECTED'
WHERE qualification = 'REJECT' OR final_qualification = 'REJECT';
