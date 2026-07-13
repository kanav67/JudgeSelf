import { createClient } from 'redis';
import { env } from './env.js';

export const redisClient = createClient({
  url: env.redisAddr,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const InitRedis = async () => {
  await redisClient.connect();
  console.log('Redis client connected successfully');
}
