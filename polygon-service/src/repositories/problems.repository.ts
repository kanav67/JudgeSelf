import { pool } from '../config/postgres';

type ProblemRecord = {
  id: string;
  contestId: number;
  problemIndex?: number;
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

//todo switch to orm
export const createProblemRecord = async (problemRecord: ProblemRecord) => {
  const query = `
    INSERT INTO problems (
      id,
      contest_id,
      problem_index,
      polygon_id,
      polygon_version,

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
      
      has_interactor,
      interactor_language,
      checker_language,
      problem_zip_key
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    RETURNING *
  `;

  const values = [
    problemRecord.id,
    problemRecord.contestId,
    problemRecord.problemIndex,
    problemRecord.polygonId,
    problemRecord.polygonVersion,

    problemRecord.name,
    problemRecord.statement,
    problemRecord.inputStatement,
    problemRecord.outputStatement,
    problemRecord.examples,
    problemRecord.notes,
    problemRecord.imagesKey,
    problemRecord.tags,

    problemRecord.memoryLimit,
    problemRecord.timeLimit,
    problemRecord.testCount,

    problemRecord.inputType,
    problemRecord.outputType,
    problemRecord.authorName,
    
    problemRecord.hasInteractor,
    problemRecord.interactorLanguage,
    problemRecord.checkerLanguage,

    problemRecord.problemZipKey,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getProblemById = async (problemId: string) => {
  const { rows } = await pool.query('SELECT * FROM problems WHERE id = $1::uuid', [problemId]);
  return rows[0] ?? null;
};

export const getProblemByName = async (name: string) => {
  const { rows } = await pool.query('SELECT * FROM problems WHERE name = $1', [name]);
  return rows[0] ?? null;
};
