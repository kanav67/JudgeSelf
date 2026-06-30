package engine

import (
	"strings"
	"sync"
	"time"
)

type cacheDbItem struct {
	data      ProblemData
	expiresAt time.Time
}

type DbCache struct {
	mu    sync.RWMutex
	store map[string]cacheDbItem
	ttl   time.Duration
}

type S3Cache struct {
	mu    sync.RWMutex
	store map[string]string
}

type Cache struct {
	DbCache *DbCache
	S3Cache *S3Cache
}

func NewCache() *Cache {
	return &Cache{
		DbCache: &DbCache{store: make(map[string]cacheDbItem), ttl: 5 * time.Minute},
		S3Cache: &S3Cache{store: make(map[string]string)},
	}
}

func (c *Cache) GetOrLoad(problemID string) (ProblemData, string) {
	problemData := c.DbCache.GetOrLoad(problemID)
	localProblemCachePath := c.S3Cache.GetOrLoad(problemData)

	return problemData, localProblemCachePath
}

func (c *DbCache) GetOrLoad(problemId string) ProblemData {
	c.mu.RLock() 

	item, exists := c.store[problemId]	
	if exists && time.Now().Before(item.expiresAt) {
		c.mu.RUnlock()
		return item.data
	}
	c.mu.RUnlock()

	//todo: fetch from db

	return item.data
}

func (c *S3Cache) GetOrLoad(problemData ProblemData) string {
	c.mu.RLock()

	key := strings.Join([]string{problemData.ProblemID, problemData.ProblemVersion}, "_");

	item, exists := c.store[key]	
	c.mu.RUnlock()
	if exists {
		return item
	}
	//todo: fetch from db
	
	return item
}
