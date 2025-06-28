import { Queue } from 'bullmq';
export const AvailabilityQueue = new Queue('availability', {
  connection: { host: 'localhost', port: 6379 },
});
