package sandbox

import (
	"encoding/json"
	"log"
	"os"
	"strings"
)

type languageSource struct {
	Aliases []string `json:"aliases"`
	Compile string   `json:"compile"`
	Execute string   `json:"execute"`
}

type LanguageDetails struct {
	Compile string
	Execute string
}

// todo remove after testing is done
var runtimeLanguageMap = map[string]LanguageDetails{
	"python":  {Compile: "", Execute: "python3 {input}"},
	"python3": {Compile: "", Execute: "python3 {input}"},
	"py":      {Compile: "", Execute: "python3 {input}"},
	"cpp":     {Compile: "g++ {input} -o {output}", Execute: "./{output}"},
	"c++":     {Compile: "g++ {input} -o {output}", Execute: "./{output}"},
	"g++":     {Compile: "g++ {input} -o {output}", Execute: "./{output}"},
}

func init() {
	content, err := os.ReadFile("users.json")
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

func GetCompileCommand(lang string, inputFile string, outputFile string) (string, bool) {
	config, exists := runtimeLanguageMap[strings.ToLower(strings.TrimSpace(lang))]
	if !exists {
		return "", false
	}
	tmp := strings.ReplaceAll(config.Compile, "{input}", inputFile)
	tmp = strings.ReplaceAll(tmp, "{output}", outputFile)
	return tmp, true
}

func GetExecuteCommand(lang string, inputFile string) (string, bool) {
	config, exists := runtimeLanguageMap[strings.ToLower(strings.TrimSpace(lang))]
	if !exists {
		return "", false
	}
	return strings.ReplaceAll(config.Execute, "{input}", inputFile), true
}
