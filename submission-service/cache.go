package main

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

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
	return &Cache{store: make(map[string]cacheItem), ttl: 5 * time.Minute, DbClient: DbClient}
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