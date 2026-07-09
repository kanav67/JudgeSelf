package engine

import (
	"context"
	"encoding/json"
	"execution-engine/models"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresClient struct {
	pool            *pgxpool.Pool
	problemTable    string
	submissionTable string
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

	return &PostgresClient{pool: pool, problemTable: problemTable, submissionTable: submissionTable}, nil
}

func (r *PostgresClient) Close() {
	r.pool.Close()
}

func (r *PostgresClient) GetProblemData(ctx context.Context, problemID string) (models.ProblemData, error) {
	query := fmt.Sprintf(`
	SELECT 
	id,
	polygon_version,
	contest_id,
	time_limit, 
	memory_limit, 
	test_count,
	checker_language,
	problem_zip_key 
	FROM %s WHERE id = $1`, r.problemTable)

	var data models.ProblemData
	err := r.pool.QueryRow(ctx, query, problemID).Scan(
		&data.ProblemID,
		&data.ProblemVersion,
		&data.ContestID,
		&data.TimeLimit,
		&data.MemoryLimit,
		&data.TestCount,
		&data.CheckerLanguage,
		&data.S3Hash,
	)

	if err != nil {
		return models.ProblemData{}, err
	}

	return data, nil
}

func (r *PostgresClient) UpdateSubmission(ctx context.Context, verdict models.Verdict) error {
	query := fmt.Sprintf(`UPDATE %s SET status = $1, time = $2, memory = $3, results = $4, updated_at = NOW() WHERE id = $5`, r.submissionTable)
	jsonData, err := json.Marshal(verdict.Results)
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx, query, verdict.Status, verdict.Time, verdict.Memory, string(jsonData), verdict.SubmissionID)
	return err
}
