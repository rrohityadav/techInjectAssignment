import { Queue } from 'bullmq';
export const AvailabilityQueue = new Queue('availability', {
  connection:  { url: redisUrl }
});
