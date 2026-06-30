package engine

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/s3/transfermanager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Client struct {
	client     *s3.Client
	downloader *transfermanager.Client
	bucketName string
}

func NewS3Client(bucketName string, region string, s3Endpoint string, s3ForcePathStyle bool) (*S3Client, error) {
	cfg, err := config.LoadDefaultConfig(context.Background(), config.WithRegion(region))
	if err != nil {
		return nil, fmt.Errorf("Unable to load AWS SDK config: %w", err)
	}

	 s3Client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(s3Endpoint)
		o.UsePathStyle = s3ForcePathStyle
	})

	downloader := transfermanager.New(s3Client, func(d *transfermanager.Options) {
		d.PartSizeBytes = 10* 1024 * 1024 //10mb
		d.Concurrency = 5
	})

	return &S3Client{
		client:     s3Client,
		downloader: downloader,
		bucketName: bucketName,
	}, nil
}

func (s *S3Client) DownloadZip(ctx context.Context, s3Key string, destinationFolder string) error {
	os.MkdirAll(destinationFolder, 0644)

	tmpFilePath := filepath.Join(destinationFolder, "temp.zip")
	file, err := os.Create(tmpFilePath)
	if err != nil {
		return fmt.Errorf("Failed to create destinationFolder file to download file: %w", err)
	}

	defer file.Close()

	_, err = s.downloader.DownloadObject(ctx, &transfermanager.DownloadObjectInput{
		Bucket:   aws.String(s.bucketName),
		Key:      aws.String(s3Key),
		WriterAt: file,
	})

	if err != nil {
		return fmt.Errorf("Failed to download s3://%s/%s: %w", s.bucketName, s3Key, err)
	}

	err = Unzip(tmpFilePath, destinationFolder)
	if err != nil {
		return fmt.Errorf("Failed to unzip file %s: %w", tmpFilePath, err)
	}

	//cleanup
	_ = os.Remove(tmpFilePath)

	return nil
}

// todo move to dedicated file
func Unzip(zipFilePath, destinationFolder string) error {
	reader, err := zip.OpenReader(zipFilePath)
	if err != nil {
		return err
	}
	defer reader.Close()

	if err := os.MkdirAll(destinationFolder, 0644); err != nil {
		return err
	}

	for _, file := range reader.File {
		path := filepath.Join(destinationFolder, file.Name)
		if !strings.HasPrefix(path, filepath.Clean(destinationFolder)+string(os.PathSeparator)) {
			return fmt.Errorf("illegal file path: %s", path)
		}

		if file.FileInfo().IsDir() {
			os.MkdirAll(path, file.Mode())
			continue
		}

		if err := os.MkdirAll(filepath.Dir(path), 0644); err != nil {
			return err
		}

		f, err := file.Open()
		if err != nil {
			return err
		}
		defer f.Close()

		outFile, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
		if err != nil {
			return err
		}
		defer outFile.Close()

		_, err = io.Copy(outFile, f)
		if err != nil {
			return err
		}
	}
	return nil
}
