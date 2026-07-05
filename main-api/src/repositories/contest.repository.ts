import { pool } from '../config/postgres.js';
import type { ProblemRecord } from './problems.repository.js';

export type ContestData = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  owner_id: string;
  problems: ProblemRecord[] | null;
};

export const createContest = async (contest: { name: string; start_time: string; end_time: string; owner_id: string }) : Promise<ContestData> => {
  const query = `
    INSERT INTO contests (name, start_time, end_time, owner_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const values = [contest.name, contest.start_time, contest.end_time, contest.owner_id];

  const {rows} = await pool.query(query, values);
  return rows[0];
};

export const getContestById = async (id: string, includeProblemData: boolean) : Promise<ContestData | null> => {
  const query = 'SELECT * FROM contests WHERE id = $1::uuid';
  const values = [id];

  const {rows} = await pool.query(query, values);
  if (rows.length === 0) return null;
  
  const contest: ContestData = rows[0];
  if (includeProblemData) {
    contest.problems = await getProblemsDataByContestId(id);
  }
  return contest;
};

export const getProblemsDataByContestId = async (contestId: string) : Promise<ProblemRecord[]> => {
  const query = `
    SELECT 
    id,

    name,

    memory_limit,
    time_limit,
    test_count,

    input_type,
    output_type,
    author_name,

    FROM problems
    WHERE contest_id = $1::uuid;
  `;
  const values = [contestId];

  const { rows } = await pool.query(query, values);
  return rows;
}