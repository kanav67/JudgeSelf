package main

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

//todo move to config
const CacheCleanupThreshold = 30 //minimum number of cache items before cleanup can be triggered
const CacheCleanupInterval = 15 * time.Minute //time interval after which cache items are checked for expiration

type cacheItem struct {
	data      ProblemData
	expiresAt time.Time
}

type Cache struct {
	mu       sync.RWMutex
	store    map[string]cacheItem
	ttl      time.Duration
	DbClient *PostgresClient
}

func NewCache(DbClient *PostgresClient) *Cache {
	c := &Cache{store: make(map[string]cacheItem), ttl: 5 * time.Minute, DbClient: DbClient}

	go func() {
		ticker := time.NewTicker(CacheCleanupInterval)
		defer ticker.Stop()
		for range ticker.C {
			cleanCache(c)
		}
	}()

	return c
}

func (c *Cache) GetOrLoad(ctx context.Context, problemId string) (ProblemData, error) {
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
		return ProblemData{}, fmt.Errorf("Failed to get problem data from database: %v", err)
	}

	log.Printf("Successfully loaded problem %s from database", problemId)

	c.store[problemId] = cacheItem{
		data:      problemData,
		expiresAt: time.Now().Add(c.ttl),
	}
	return problemData, nil
}

func cleanCache(c *Cache) {
	now := time.Now()

	if len(c.store) <= CacheCleanupThreshold {
		return
	}
	c.mu.Lock()
	defer c.mu.Unlock()

	cnt := 0
	for k, v := range c.store {
		if now.After(v.expiresAt) {
			delete(c.store, k)
			cnt++
		}
	}
	log.Printf("Cleaned up %d stale cache items.", cnt)
}
