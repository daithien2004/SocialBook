/**
 * healthcheck.js — Script kieåm tra söùc khoûe Worker.
 * Ñöôïc Docker goïi qua healthcheck.test moãi 30 giaây.
 *
 * Kieåm tra:
 * 1. Keát noái ñöôïc vaøo redis-queue (keát noái thieát yeáu cuûa Worker).
 * 2. Leänh PING traû veà ñuùng "PONG".
 *
 * Exit code 0 = khoûe, 1 = troïng beänh (Docker seõ restart container).
 */
const redis = require('ioredis');

const client = new redis.Redis({
  host: process.env.BULL_REDIS_HOST || 'localhost',
  port: parseInt(process.env.BULL_REDIS_PORT || '6379', 10),
  password: process.env.BULL_REDIS_PASSWORD,
  connectTimeout: 3000,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
});

async function check() {
  try {
    await client.connect();
    const pong = await client.ping();
    if (pong !== 'PONG') throw new Error(`Expected PONG, got ${pong}`);
    console.log('Worker healthcheck: OK');
    await client.quit();
    process.exit(0);
  } catch (err) {
    console.error('Worker healthcheck FAILED:', err.message);
    try { await client.quit(); } catch (_) {}
    process.exit(1);
  }
}

check();
