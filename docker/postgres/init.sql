CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY,
  contest_id INT NOT NULL REFERENCES contests(id),
  problem_index TEXT, -- can be null, indicating it is deleted
  type TEXT NOT NULL, -- can be "PRACTICE" or "RATED"

  polygon_id TEXT NOT NULL, -- polygon url
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

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id),
  user_id UUID NOT NULL REFERENCES users(id),
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUE',
  time BIGINT,
  memory BIGINT,
  results JSONB, -- JSONB will help in indexing in future
  relative_submission_time BIGINT, -- relative to contest start time
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contests (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  leaderboard_frozen BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ensures for non NULL problem_index, the combination of contest_id and problem_index is unique
CREATE UNIQUE INDEX unique_contestid_problem_index 
ON problems (contest_id, problem_index) 
WHERE problem_index IS NOT NULL;

CREATE TABLE IF NOT EXISTS contest_results (
  contest_id INT NOT NULL REFERENCES contests(id),
  user_id UUID NOT NULL REFERENCES users(id),
  rank INT NOT NULL,
  score BIGINT NOT NULL,
  problems_solved INT NOT NULL,
  penalty BIGINT NOT NULL,
  problem_details JSONB NOT NULL,
  PRIMARY KEY (contest_id, user_id)
);

CREATE INDEX idx_contest_results_contest_rank 
ON contest_results (contest_id, rank);