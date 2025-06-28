import { Worker, Job } from 'bullmq';
import axios from 'axios';
const redisUrl = process.env.REDIS_URL;

export const AvailabilityWorker = new Worker(
  'availability',
  async (job: Job) => {
    const { endpoint, sku, newStock } = job.data as {
      endpoint: string;
      sku: string;
      newStock: number;
    };
    await axios.post(endpoint, { sku, newStock });
  },
  {
    connection: { url: redisUrl }
  }
);

AvailabilityWorker.on('failed', (job,err)=>{
});