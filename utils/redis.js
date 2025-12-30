const Redis = require('ioredis');
const config = require('../config.json');

let redisClient = null;
let redisSubscriber = null;
let redisPublisher = null;

/**
 * Kết nối Redis client
 */
function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      retryStrategy: times => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Đã kết nối Redis client');
    });

    redisClient.on('error', error => {
      console.error('[Redis] Lỗi Redis client:', error);
    });
  }
  return redisClient;
}

/**
 * Kết nối Redis subscriber (chỉ đọc)
 */
function getRedisSubscriber() {
  if (!redisSubscriber) {
    redisSubscriber = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      retryStrategy: times => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisSubscriber.on('connect', () => {
      console.log('[Redis] Đã kết nối Redis subscriber');
    });

    redisSubscriber.on('error', error => {
      console.error('[Redis] Lỗi Redis subscriber:', error);
    });
  }
  return redisSubscriber;
}

/**
 * Kết nối Redis publisher (chỉ ghi)
 */
function getRedisPublisher() {
  if (!redisPublisher) {
    redisPublisher = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      retryStrategy: times => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisPublisher.on('connect', () => {
      console.log('[Redis] Đã kết nối Redis publisher');
    });

    redisPublisher.on('error', error => {
      console.error('[Redis] Lỗi Redis publisher:', error);
    });
  }
  return redisPublisher;
}

/**
 * Đóng tất cả kết nối Redis
 */
async function closeRedis() {
  const promises = [];
  if (redisClient) {
    promises.push(redisClient.quit());
    redisClient = null;
  }
  if (redisSubscriber) {
    promises.push(redisSubscriber.quit());
    redisSubscriber = null;
  }
  if (redisPublisher) {
    promises.push(redisPublisher.quit());
    redisPublisher = null;
  }
  await Promise.all(promises);
  console.log('[Redis] Đã đóng tất cả kết nối Redis');
}

module.exports = {
  getRedisClient,
  getRedisSubscriber,
  getRedisPublisher,
  closeRedis,
};

