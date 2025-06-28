import { Worker, Job } from 'bullmq';
import axios from 'axios';

export const AvailabilityWorker = new Worker(
  'availability',
  async (job: Job) => {
    const { endpoint, sku, newStock } = job.data as {
      endpoint: string;
      sku: string;
      newStock: number;
    };
    // POST the payload
    await axios.post(endpoint, { sku, newStock });
  },
  {
    connection: { host: 'localhost', port: 6379 },
    // remove jobs on success; keep on fail for dead-letter inspection
    // removeOnComplete: true,
    // removeOnFail: false,
  }
);

// Log final failures (after 5 attempts)
AvailabilityWorker.on('failed', (job, err) => {
  console.error(
    `🛑 Webhook job for ${job?.data.endpoint} failed ${job?.attemptsMade} times:`,
    err.message
  );
});
