package sandbox

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
)

func ReadSnippet(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	limitedReader := io.LimitReader(file, MaxBytesToRead)
	snippet, err := io.ReadAll(limitedReader)

	return string(snippet), err
}

func CopyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("failed to open source file: %w", err)
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return fmt.Errorf("failed to create destination file: %w", err)
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return fmt.Errorf("failed to copy data: %w", err)
	}

	err = destFile.Sync()
	if err != nil {
		return fmt.Errorf("failed to sync destination file: %w", err)
	}

	return nil
}

func CopyDirFiles(srcDir, dstDir string) error {
	err := os.MkdirAll(dstDir, 0755)
	if err != nil {
		return fmt.Errorf("failed to create destination directory: %w", err)
	}

	entries, err := os.ReadDir(srcDir)
	if err != nil {
		return fmt.Errorf("failed to read source directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		srcPath := filepath.Join(srcDir, entry.Name())
		dstPath := filepath.Join(dstDir, entry.Name())

		err = CopyFile(srcPath, dstPath)
		if err != nil {
			return fmt.Errorf("failed to copy file %s: %w", entry.Name(), err)
		}
	}

	return nil
}
