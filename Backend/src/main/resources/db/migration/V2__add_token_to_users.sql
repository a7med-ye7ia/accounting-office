-- Add token column to users table for JWT session management
-- The token is set on login and cleared on logout

ALTER TABLE users ADD COLUMN IF NOT EXISTS token VARCHAR(1024);
