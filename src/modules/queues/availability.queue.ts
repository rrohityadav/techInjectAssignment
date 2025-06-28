import { Queue } from 'bullmq';
const redisUrl = process.env.REDIS_URL;
export const AvailabilityQueue = new Queue('availability', {
  connection:  { url: redisUrl }
});
