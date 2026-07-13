import { pool } from "../../../problem-service/src/config/postgres.js";

export interface SubmissionRow {
  submissionId: string;
  userId: string;
  problemId: string;
  contestId: string;
  problemIndex?: string;
  status: string;
  time: number;
  memory: number;
  createdAt: Date;
}

export const getSubmissionsFromDB = async (contestId?: string, userId?: string, page: number = 1, limit?: number): Promise<SubmissionRow[]> => {
  var query = `
    SELECT s.id, s.user_id, s.problem_id, s.status, s.time, s.memory, s.created_at, p.contest_id, p.problem_index
    FROM submissions s
    JOIN problems p ON s.problem_id = p.id`;
    
  if (contestId) {
    query += `
        WHERE p.contest_id = $1 ${userId ? `AND s.user_id = $2` : ''}
        ORDER BY s.created_at DESC`;
  } else {
    query += `
        ${userId ? `WHERE s.user_id = $1` : ''}
        ORDER BY s.created_at DESC`;
  }

  const params: string[] = [];
  if (contestId) params.push(contestId);
  if (userId) params.push(userId);
  if (limit) {
    params.push(limit.toString());
    query += ` LIMIT $${params.length}`;

    //todo avoid OFFSET 
    const offset = (page - 1) * limit;
    params.push(offset.toString());
    query += ` OFFSET $${params.length}`;
  }

  const res = await pool.query(query, params);

  return res.rows.map(row => ({
    submissionId: row.id,
    userId: row.user_id,
    problemId: row.problem_id,
    contestId: row.contest_id,
    problemIndex: row.problem_index,
    status: row.status,
    time: row.time ?? 0,
    memory: row.memory ?? 0,
    createdAt: row.created_at
  }));
}

export const getSubmissionsCount = async (contestId?: string, userId?: string): Promise<number> => {
  var query;
  if (contestId) {
    query = `SELECT COUNT(*) FROM submissions s
        JOIN problems p ON s.problem_id = p.id
        WHERE p.contest_id = $1 ${userId ? `AND s.user_id = $2` : ''}`;
  } else {
    query = `SELECT COUNT(*) FROM submissions ${userId ? `WHERE user_id = $1` : ''}`;
  }

  const params: string[] = [];
  if (contestId) params.push(contestId);
  if (userId) params.push(userId);

  const res = await pool.query(query, params);
  return parseInt(res.rows[0].count, 10);
}