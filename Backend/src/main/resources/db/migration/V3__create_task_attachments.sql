CREATE TABLE IF NOT EXISTS attachments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL UNIQUE,
    file_path VARCHAR(1000) NOT NULL,
    content_type VARCHAR(150) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_attachments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_attachments_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_attachments_task ON attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);
