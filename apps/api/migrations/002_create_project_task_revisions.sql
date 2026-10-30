CREATE TABLE IF NOT EXISTS project_task_revisions (
  project_id TEXT PRIMARY KEY,
  revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0)
);
