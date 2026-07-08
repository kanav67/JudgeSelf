package main

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresClient struct {
	pool            *pgxpool.Pool
	problemTable    string
	submissionTable string
	contestTable    string
}

func NewPostgresClient(dsn string) (*PostgresClient, error) {
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		return nil, err
	}

	problemTable := "problems"
	submissionTable := "submissions"
	contestTable := "contests"

	return &PostgresClient{pool, problemTable, submissionTable, contestTable}, nil
}

func (r *PostgresClient) Close() {
	r.pool.Close()
}

func (r *PostgresClient) GetProblemData(ctx context.Context, problemID string) (ProblemData, error) {
	query := fmt.Sprintf(`
	SELECT 
	p.id,
	p.polygon_version,
	contest_id,
	c.start_time,
	c.end_time
	FROM %s p JOIN %s c USING (contest_id) WHERE p.id = $1`, r.problemTable, r.contestTable)

	var data ProblemData
	err := r.pool.QueryRow(ctx, query, problemID).Scan(
		&data.ProblemID,
		&data.ProblemVersion,
		&data.ContestInfo.ContestID,
		&data.ContestInfo.StartTime,
		&data.ContestInfo.EndTime,
	)

	if err != nil {
		return ProblemData{}, err
	}

	return data, nil
}

func (r *PostgresClient) CreateSubmission(ctx context.Context, req SubmissionRequest) (string, error) {
	query := fmt.Sprintf(`INSERT INTO %s (problem_id, language, code, user_id, updated_at, relative_submission_time) VALUES ($1, $2, $3, $4, NOW(), $5) RETURNING id`, r.submissionTable)

	var submissionID string
	err := r.pool.QueryRow(ctx, query, req.ProblemID, req.Language, req.Code, req.UserID, req.RelativeSubmissionTime).Scan(&submissionID)
	if err != nil {
		return "", err
	}
	return submissionID, nil
}

func (r *PostgresClient) DeleteSubmission(ctx context.Context, submissionID string) error {
	query := fmt.Sprintf(`DELETE FROM %s WHERE id = $1`, r.submissionTable)
	_, err := r.pool.Exec(ctx, query, submissionID)
	return err
}
