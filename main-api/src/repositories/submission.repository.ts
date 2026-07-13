import { pool } from '../config/postgres.js';

export type SubmissionData = {
  id: string;
  problem_id: string;
  user_id: string;
  type: string;
  code: string;
  language: string;
  status: string;
  time: number | null;
  memory: number | null;
  results: unknown;
  relative_submission_time: number | null;
  created_at: Date;
  contest_id: number;
  contest_owner_id: string;
  contest_start_time: Date;
  contest_end_time: Date;
};

const getSubmissionById = async (submissionId: string): Promise<SubmissionData | null> => {
  const query = `
		SELECT
			s.id,
			s.problem_id,
			s.user_id,
			s.type,
			s.code,
			s.language,
			s.status,
			s.time,
			s.memory,
			s.results,
			s.relative_submission_time,
			s.created_at,
			p.contest_id,
			c.owner_id AS contest_owner_id,
			c.start_time AS contest_start_time,
			c.end_time AS contest_end_time
		FROM submissions s
		JOIN problems p ON p.id = s.problem_id
		JOIN contests c ON c.id = p.contest_id
		WHERE s.id = $1::int
	`;

  const { rows } = await pool.query(query, [submissionId]);
  return rows[0] ?? null;
};

export const SubmissionRepository = {
  getSubmissionById,
};