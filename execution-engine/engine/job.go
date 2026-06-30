package engine

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"strconv"
)

type SubmissionData struct {
	SubmissionID   string `json:"submission_id"`
	SourceCode     string `json:"source_code"`
	SourceLanguage string `json:"language"`
	ProblemID      string `json:"problem_id"`
}

type ProblemData struct {
	ProblemID       string
	ProblemVersion  string
	TimeLimit       int64 //ms
	MemoryLimit     int64 //kb
	TestCount       int
	CheckerLanguage string
	S3Hash          string
	LocalProblemDir string
}

type Verdict struct {
	SubmissionID string   `json:"submission_id"`
	Status       string   `json:"status"`
	Time         int64    `json:"time_millis"`
	Memory       int64    `json:"memory_bytes"`
	Results      []Result `json:"results"`
}

type Result struct {
	Test          int     `json:"test"`
	Time          float64 `json:"time"`
	Memory        int     `json:"memory"`
	Status        string  `json:"status"` //AC, CE, WA, TLE, IL(Idle Limit), RE(has variations), INT(Internal Error)
	Message       string  `json:"message"`
	InputSnippet  string  `json:"input_snippet"`
	OutputSnippet string  `json:"output_snippet"`
	AnswerSnippet string  `json:"answer_snippet"`
}

type Job struct {
	SubmissionData *SubmissionData
	ProblemData    *ProblemData
	Verdict        *Verdict
}

func ParseSubmissionData(payload []byte) (SubmissionData, error) {
	var data SubmissionData
	if err := json.Unmarshal(payload, &data); err != nil {
		return SubmissionData{}, err
	}
	return data, nil
}

func (pd *ProblemData) GetTestsDir() string {
	return filepath.Join(pd.LocalProblemDir, "tests")
}

func (pd *ProblemData) GetTestFileName(test int) string {
	length := len(strconv.Itoa(pd.TestCount))
	return fmt.Sprintf("%0*d", length, test)
}

func (pd *ProblemData) GetAnswerFileName(test int) string {
	return pd.GetTestFileName(test) + ".a"
}

func (pd *ProblemData) GetTestFilePath(test int) string {
	return filepath.Join(pd.GetTestsDir(), pd.GetTestFileName(test))
}

func (pd *ProblemData) GetAnswerFilePath(test int) string {
	return pd.GetTestFilePath(test) + ".a"
}

func (pd *ProblemData) GetCheckerSourcePath() string {
	return filepath.Join(pd.LocalProblemDir, "checker")
}

func (pd *ProblemData) GetResourcesFolder() string {
	return filepath.Join(pd.LocalProblemDir, "resources")
}
