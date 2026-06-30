package engine

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

type cacheDbItem struct {
	data      ProblemData
	expiresAt time.Time
}

type DbCache struct {
	mu       sync.RWMutex
	store    map[string]cacheDbItem
	ttl      time.Duration
	DbClient *PostgresClient
}

type S3Cache struct {
	mu       sync.RWMutex
	store    map[string]string
	S3Client *S3Client
}

type Cache struct {
	DbCache *DbCache
	S3Cache *S3Cache
}

func NewCache(DbClient *PostgresClient, S3Client *S3Client) *Cache {
	return &Cache{
		DbCache:  &DbCache{store: make(map[string]cacheDbItem), ttl: 5 * time.Minute, DbClient: DbClient},
		S3Cache:  &S3Cache{store: make(map[string]string), S3Client: S3Client},
	}
}

func (c *Cache) GetOrLoad(problemID string) (ProblemData, error) {
	problemData, err := c.DbCache.GetOrLoad(problemID)
	if err != nil {
		return ProblemData{}, err
	}
	localProblemCachePath, err := c.S3Cache.GetOrLoad(problemData)
	if err != nil {
		return ProblemData{}, err
	}
	problemData.LocalProblemDir = localProblemCachePath

	return problemData, nil
}

func (c *DbCache) GetOrLoad(problemId string) (ProblemData, error) {
	c.mu.RLock()

	item, exists := c.store[problemId]
	if exists && time.Now().Before(item.expiresAt) {
		c.mu.RUnlock()
		return item.data, nil
	}
	c.mu.RUnlock()

	//todo improve this, currently if it takes 5secs to load from db, all other requests will wait for it to finish, even those not affected
	//maybe use mutex per cacheItem
	c.mu.Lock()
	defer c.mu.Unlock()

	item, exists = c.store[problemId]
	if exists && time.Now().Before(item.expiresAt) {
		return item.data, nil
	}

	problemData, err := c.DbClient.GetProblemData(problemId)
	if err != nil {
		return ProblemData{}, fmt.Errorf("Failed to get problem data from database: %v", err)
	}

	c.store[problemId] = cacheDbItem{
		data:      problemData,
		expiresAt: time.Now().Add(c.ttl),
	}
	return item.data, nil
}

func (c *S3Cache) GetOrLoad(problemData ProblemData) (string, error) {
	c.mu.RLock()

	key := strings.Join([]string{problemData.ProblemID, problemData.ProblemVersion}, "_")

	item, exists := c.store[key]
	c.mu.RUnlock()
	if exists {
		return item, nil
	}
	
	c.mu.Lock()
	defer c.mu.Unlock()
	
	item, exists = c.store[key]
	if exists {
		return item, nil
	}

	localProblemCachePath := "/tmp/execution-engine/problems/" + key
	err := c.S3Client.DownloadZip(problemData.S3Hash, localProblemCachePath)
	if err != nil {
		return "", fmt.Errorf("Failed to download problem zip from S3: %v", err)
	}

	c.store[key] = localProblemCachePath

	return item, nil
}
