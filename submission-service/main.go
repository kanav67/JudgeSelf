package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5"
)

type ProblemData struct {
	ProblemID      string `json:"problem_id"`
	ProblemVersion int    `json:"problem_version"`
}

type SubmissionRequest struct {
	ProblemID string `json:"problem_id"`
	Language  string `json:"language"`
	Code      string `json:"code"`
	UserID    string
}

type SubmissionResponse struct {
	SubmissionID string `json:"submission_id"`
	Message      string `json:"message"`
}

type QueueMessage struct {
	SubmissionID   string `json:"submission_id"`
	Code           string `json:"source_code"`
	Language       string `json:"language"`
	ProblemID      string `json:"problem_id"`
	ProblemVersion int    //future
}

type App struct {
	Config            *Config
	DB                *PostgresClient
	RabbitMQPublisher *RabbitMQPublisher
	Languages         []string
}

func main() {
	cfg := LoadConfig()

	db, err := NewPostgresClient(cfg.PostgresDSN)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	rmq, err := InitRabbitMQ(cfg.RabbitURL, cfg.RabbitQueue)
	if err != nil {
		log.Fatalf("RabbitMQ connection failed: %v", err)
	}
	defer rmq.Close()

	app := &App{Config: &cfg, DB: db, RabbitMQPublisher: rmq, Languages: LoadLanguages()}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /languages", app.HandleLanguages)
	mux.HandleFunc("POST /submit", AuthMiddleware(app.HandleSubmit, []byte(cfg.JwtSecret)))

	log.Println("API Server listening on :8080...")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

func LoadLanguages() []string {
	//read languages.json
	content, err := os.ReadFile("languages.json")
	if err != nil {
		log.Fatalf("Error reading languages file: %v", err)
	}

	rawLanguages := []struct {
		Aliases []string `json:"aliases"`
	}{}

	err = json.Unmarshal(content, &rawLanguages)
	if err != nil {
		log.Fatalf("Error parsing languages JSON: %v", err)
	}
	
	log.Printf("Total %d languages loaded", len(rawLanguages))

	var languages []string
	for _, inner := range rawLanguages {
		languages = append(languages, inner.Aliases...)
	}

	return languages
}

// GET /languages
func (app *App) HandleLanguages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid_languages": app.Languages,
	})
}

// POST /submit
func (app *App) HandleSubmit(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := ctx.Value(userIDKey).(string) //set in auth middleware

	var req SubmissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	req.UserID = userID

	problemData, err := app.DB.GetProblemData(ctx, req.ProblemID)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Invalid Problem ID", http.StatusBadRequest)
			return
		}

		log.Printf("DB error checking problem: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	subID, err := app.DB.CreateSubmission(ctx, req)
	if err != nil {
		log.Printf("Failed to insert submission: %v", err)
		http.Error(w, "Failed to create submission", http.StatusInternalServerError)
		return
	}

	msg := QueueMessage{
		SubmissionID:   subID,
		ProblemID:      problemData.ProblemID, //formats it properly
		Language:       req.Language,
		Code:           req.Code,
		ProblemVersion: problemData.ProblemVersion,
	}

	if err := app.RabbitMQPublisher.PublishSubmission(msg); err != nil {
		log.Printf("Failed to publish to RMQ: %v", err)

		err = app.DB.DeleteSubmission(ctx, subID)
		if err != nil {
			log.Printf("Failed to delete submission after RMQ failure: %v", err)
		}

		http.Error(w, "Failed to queue submission", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(SubmissionResponse{
		SubmissionID: subID,
		Message:      "Submission queued successfully",
	})
}
