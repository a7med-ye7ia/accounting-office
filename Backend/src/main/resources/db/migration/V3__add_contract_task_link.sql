-- Migration V3: Link amendment contracts (UPDATING) to the task they belong to,
-- so the manager review page can resolve the pending amendment per task.

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS task_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_contracts_task' AND table_name = 'contracts'
    ) THEN
        ALTER TABLE contracts ADD CONSTRAINT fk_contracts_task
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contracts_task ON contracts(task_id);
