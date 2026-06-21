-- Add PENDING_VERIFICATION to user_status enum
-- Required for email verification feature: newly created users start as PENDING_VERIFICATION
-- and can only use the system after changing their temp password.

ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'PENDING_VERIFICATION';
