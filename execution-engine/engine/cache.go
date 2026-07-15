package engine

import (
	"context"
	"execution-engine/models"
	"fmt"
	"log"
	"os"
	"slices"
	"strconv"
	"strings"
	"sync"
	"time"
)

// todo move to config
const CacheCleanupThreshold = 30              //minimum number of cache items before cleanup can be triggered
const CacheCleanupInterval = 15 * time.Minute //time interval after which cache items are checked for expiration
const CacheCleanupBuffer = 5 * time.Minute    //an extra buffer time to ensure that cache items are not deleted while in use
const TmpDir = "/tmp/execution-engine/problems/"

type cacheDbItem struct {
	data      models.ProblemData
	expiresAt time.Time
}

type DbCache struct {
	mu       sync.RWMutex
	store    map[string]cacheDbItem
	ttl      time.Duration
	DbClient *PostgresClient
}

type cacheS3Item struct {
	Mu          sync.RWMutex
	Path        string
	CompiledBin []byte
}

type S3Cache struct {
	mu       sync.RWMutex
	store    map[string]*cacheS3Item
	S3Client *S3Client
}

type Cache struct {
	DbCache *DbCache
	S3Cache *S3Cache
}

func NewCache(DbClient *PostgresClient, S3Client *S3Client) *Cache {
	c := &Cache{
		DbCache: &DbCache{store: make(map[string]cacheDbItem), ttl: 5 * time.Minute, DbClient: DbClient},
		S3Cache: &S3Cache{store: make(map[string]*cacheS3Item), S3Client: S3Client},
	}

	initCleanup()

	go func() {
		ticker := time.NewTicker(CacheCleanupInterval)
		defer ticker.Stop()
		for range ticker.C {
			cleanCache(c)
		}
	}()

	return c
}

func initCleanup() {
	os.RemoveAll(TmpDir)
	os.MkdirAll(TmpDir, 0755)
}

// this implements quite a complex logic
// so 1st it runs on periodic basis and checks if the number of items in the S3 cache (since it is the largest) is greater than the threshold
// If it is, it will check the DbCache for expired items and remove them from the DbCache
// Then it will check the S3Cache for items that are either not present in the DbCache or are older versions of the items present in the DbCache and remove them from the S3Cache
// Now as a precaution before removing items from db cache we add a buffer time of 5 minutes to ensure the cache is freed by any running processes before it is removed from the cache
// in case some new process starts using the cache item, the db cache will be refreshed and hence s3 cache will not be removed in next cleanup
func cleanCache(c *Cache) {
	now := time.Now()

	if len(c.S3Cache.store) <= CacheCleanupThreshold {
		return
	}

	c.DbCache.mu.Lock()
	c.S3Cache.mu.Lock()
	defer c.DbCache.mu.Unlock()
	defer c.S3Cache.mu.Unlock()

	cnt := 0
	var validKeys []string
	for k, v := range c.DbCache.store {
		if now.After(v.expiresAt.Add(CacheCleanupBuffer)) {
			delete(c.DbCache.store, k)
		} else {
			validKeys = append(validKeys, k)
		}
	}

	latestS3Keys := map[string]int{}
	for k := range c.S3Cache.store {
		key := strings.Split(k, "_")[0]
		version, _ := strconv.Atoi(strings.Split(k, "_")[1])

		item, exists := latestS3Keys[key]
		if !exists || item < version {
			latestS3Keys[key] = version
		}
	}

	for k, v := range c.S3Cache.store {
		key := strings.Split(k, "_")[0]
		version, _ := strconv.Atoi(strings.Split(k, "_")[1])

		//delete if not present in the dbcache or is an older versions
		if !slices.Contains(validKeys, key) || version < latestS3Keys[key] {
			delete(c.S3Cache.store, k)
			os.RemoveAll(v.Path)
			cnt++
		}
	}

	log.Printf("Cleaned up %d stale cache items.", cnt)
}

func (c *Cache) GetOrLoad(ctx context.Context, problemID string) (models.ProblemData, error) {
	problemData, err := c.DbCache.GetOrLoad(ctx, problemID)
	if err != nil {
		return models.ProblemData{}, err
	}
	localProblemCacheItem, err := c.S3Cache.GetOrLoad(ctx, problemData)
	if err != nil {
		return models.ProblemData{}, err
	}
	problemData.LocalProblemDir = localProblemCacheItem.Path

	return problemData, nil
}

func (c *DbCache) GetOrLoad(ctx context.Context, problemId string) (models.ProblemData, error) {
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

	log.Printf("Loading problem %s from database", problemId)
	problemData, err := c.DbClient.GetProblemData(ctx, problemId)
	if err != nil {
		return models.ProblemData{}, fmt.Errorf("Failed to get problem data from database: %v", err)
	}

	c.store[problemId] = cacheDbItem{
		data:      problemData,
		expiresAt: time.Now().Add(c.ttl),
	}
	return problemData, nil
}

func (c *S3Cache) GetOrLoad(ctx context.Context, problemData models.ProblemData) (*cacheS3Item, error) {
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

	localProblemCachePath := TmpDir + key
	log.Printf("Downloading problem %s version %s from S3 to %s", problemData.ProblemID, problemData.ProblemVersion, problemData.S3Hash)
	err := c.S3Client.DownloadZip(ctx, problemData.S3Hash, localProblemCachePath)
	if err != nil {
		return nil, fmt.Errorf("Failed to download problem zip from S3: %v", err)
	}

	c.store[key] = &cacheS3Item{
		Path:      localProblemCachePath,
		CompiledBin: nil,
	}

	return c.store[key], nil
}
