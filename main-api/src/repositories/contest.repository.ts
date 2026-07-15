import { pool } from '../config/postgres.js';
import { ProblemsRepository, type ProblemRecord } from './problems.repository.js';

export type ContestData = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  owner_id: string;
  problems: ProblemRecord[] | null;
};

const createContest = async (contest: { name: string; start_time: string; end_time: string; owner_id: string }) : Promise<ContestData> => {
  const query = `
    INSERT INTO contests (name, start_time, end_time, owner_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const values = [contest.name, contest.start_time, contest.end_time, contest.owner_id];

  const {rows} = await pool.query(query, values);
  return rows[0];
};

const getContestById = async (id: string, includeProblemData: boolean) : Promise<ContestData | null> => {
  const query = 'SELECT * FROM contests WHERE id = $1::uuid';
  const values = [id];

  const {rows} = await pool.query(query, values);
  if (rows.length === 0) return null;
  
  const contest: ContestData = rows[0];
  if (includeProblemData) {
    contest.problems = await ProblemsRepository.getProblemsDataByContestId(id);
  }
  return contest;
};

export const ContestRepository = {
  createContest,
  getContestById,
};