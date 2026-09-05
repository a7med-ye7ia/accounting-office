-- Additive, idempotent schema for SubTasks + free-task assignment (nullable parent assignee).
ALTER TABLE tasks ALTER COLUMN assigned_to DROP NOT NULL;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS sub_tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to BIGINT NULL REFERENCES users(id),
    due_date TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_tasks_task_id ON sub_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_sub_tasks_assigned_to ON sub_tasks(assigned_to);
