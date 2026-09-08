-- Migration V1: Create department_manager_departments table for Department Manager multi-department support

CREATE TABLE IF NOT EXISTS department_manager_departments (
    manager_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    CONSTRAINT pk_dept_manager_departments PRIMARY KEY (manager_id, department_id),
    CONSTRAINT fk_dmd_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_dmd_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dmd_dept ON department_manager_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_dmd_manager ON department_manager_departments(manager_id);
