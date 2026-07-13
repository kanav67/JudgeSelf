import { pool } from "../../../problem-service/src/config/postgres.js";
import type { SubmissionRow } from "./status.repository.js";

export const getProblemSubmissionsFromDB = async (problemId: string, userId?: string, page: number = 1, limit?: number): Promise<SubmissionRow[]> => {
  var query = `SELECT s.id, s.user_id, s.problem_id, s.status, s.time, s.memory, s.created_at, p.contest_id, p.problem_index
        FROM submissions s
        JOIN problems p ON s.problem_id = p.id
        WHERE s.problem_id = $1 ${userId ? `AND s.user_id = $2` : ''}
        ORDER BY s.created_at DESC`;

  const params: string[] = [problemId];
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

export const getProblemSubmissionsCount = async (problemId: string, userId?: string): Promise<number> => {
  var query = `SELECT COUNT(*) FROM submissions 
      WHERE problem_id = $1 ${userId ? `AND user_id = $2` : ''}`;

  const params: string[] = [problemId];
  if (userId) params.push(userId);

  const res = await pool.query(query, params);
  return parseInt(res.rows[0].count, 10);
}