-- Migration V2: Add branch_id and department_id to companies, and company_id to tasks

ALTER TABLE companies ADD COLUMN IF NOT EXISTS branch_id BIGINT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS department_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_companies_branch' AND table_name = 'companies'
    ) THEN
        ALTER TABLE companies ADD CONSTRAINT fk_companies_branch 
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_companies_department' AND table_name = 'companies'
    ) THEN
        ALTER TABLE companies ADD CONSTRAINT fk_companies_department 
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_branch ON companies(branch_id);
CREATE INDEX IF NOT EXISTS idx_companies_dept ON companies(department_id);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS company_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tasks_company' AND table_name = 'tasks'
    ) THEN
        ALTER TABLE tasks ADD CONSTRAINT fk_tasks_company 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
