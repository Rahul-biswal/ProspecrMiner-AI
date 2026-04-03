const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const searchQueue = new Queue('searchQueue', { connection });
const enrichQueue = new Queue('enrichQueue', { connection });
const scoringQueue = new Queue('scoringQueue', { connection });

module.exports = { searchQueue, enrichQueue, scoringQueue, connection };
