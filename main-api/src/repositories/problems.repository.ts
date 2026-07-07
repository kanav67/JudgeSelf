import { pool } from '../config/postgres.js';

export type ProblemRecord = {
  id: string;
  polygonId: string;
  polygonVersion: number;

  name: string;
  statement: string;
  inputStatement: string;
  outputStatement: string;
  examples: string;
  notes: string;
  imagesKey: string[];
  tags: string[];

  memoryLimit: number;
  timeLimit: number;
  testCount: number;

  inputType: string;
  outputType: string;
  authorName: string;

  hasInteractor: boolean;
  interactorLanguage: string | null;
  checkerLanguage: string | null;

  problemZipKey: string;
};

const problemQuery =
  `SELECT 
    id,

    name,
    statement,
    input_statement,
    output_statement,
    examples,
    notes,
    images_key,
    tags,

    memory_limit,
    time_limit,
    test_count,

    input_type,
    output_type,
    author_name,

    FROM problems`

const getProblemById = async (problemId: string) => {
  const { rows } = await pool.query(problemQuery + ' WHERE id = $1::uuid', [problemId]);
  return rows[0] ?? null;
};

const getProblemByContestIdAndIndex = async (contestId: string, problemIndex: string) => {
  const { rows } = await pool.query(problemQuery + ' WHERE contest_id = $1::uuid AND problem_index = $2', [contestId, problemIndex]);
  return rows[0] ?? null;
}

export const ProblemsRepository = {
  getProblemById,
  getProblemByContestIdAndIndex,
};