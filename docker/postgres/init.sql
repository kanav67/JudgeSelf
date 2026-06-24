CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY,
  polygon_id TEXT NOT NULL,
  polygon_version INT NOT NULL,

  name TEXT NOT NULL,
  statement TEXT NOT NULL,
  input_statement TEXT NOT NULL,
  output_statement TEXT NOT NULL,
  notes TEXT NOT NULL,
  examples TEXT NOT NULL,
  images_key TEXT[] NOT NULL,
  tags TEXT[] NOT NULL,

  memory_limit BIGINT NOT NULL,
  time_limit INT NOT NULL,
  test_count INT NOT NULL,

  input_type TEXT NOT NULL,
  output_type TEXT NOT NULL,
  author_name TEXT NOT NULL,

  has_interactor BOOLEAN NOT NULL,
  interactor_language TEXT,
  checker_language TEXT NOT NULL,
  problem_zip_key TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS problems_polygon_id_idx ON problems (polygon_id);