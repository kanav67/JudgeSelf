package sandbox

import (
	"encoding/json"
	"log"
	"os"
	"strings"
)

type languageSource struct {
	Aliases []string `json:"aliases"`
	Compile []string `json:"compile"`
	Execute []string `json:"execute"`
}

type LanguageDetails struct {
	Compile []string
	Execute []string
}

var runtimeLanguageMap = map[string]LanguageDetails{}

func init() {
	content, err := os.ReadFile("languages.json")
	if err != nil {
		log.Fatalf("Error reading languages file: %v", err)
	}

	rawLanguages := []languageSource{}
	err = json.Unmarshal(content, &rawLanguages)
	if err != nil {
		log.Fatalf("Error parsing languages JSON: %v", err)
	}

	log.Printf("Total %d languages loaded", len(rawLanguages))

	for _, lang := range rawLanguages {
		config := LanguageDetails{Compile: lang.Compile, Execute: lang.Execute}
		for _, alias := range lang.Aliases {
			runtimeLanguageMap[strings.ToLower(alias)] = config
		}
	}
}

func GetCommands(lang string) (LanguageDetails, bool) {
	config, exists := runtimeLanguageMap[strings.ToLower(strings.TrimSpace(lang))]
	return config, exists
}

func GetCompileCommand(lang string, inputFile string, outputFile string) ([]string, bool) {
	config, exists := runtimeLanguageMap[strings.ToLower(strings.TrimSpace(lang))]
	if !exists {
		return nil, false
	}
	return replacePlaceholders(config.Compile, inputFile, outputFile), true
}

func GetExecuteCommand(lang string, inputFile string) ([]string, bool) {
	config, exists := runtimeLanguageMap[strings.ToLower(strings.TrimSpace(lang))]
	if !exists {
		return nil, false
	}
	return replacePlaceholders(config.Execute, inputFile, ""), true
}

func replacePlaceholders(command []string, inputFile string, outputFile string) []string {
	replaced := make([]string, len(command))
	for i, part := range command {
		part = strings.ReplaceAll(part, "{input}", inputFile)
		part = strings.ReplaceAll(part, "{output}", outputFile)
		replaced[i] = part
	}
	return replaced
}