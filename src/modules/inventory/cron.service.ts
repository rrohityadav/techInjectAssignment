import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { InventoryService } from './inventory.service';  // ← relative path

console.log('[CRON] cron.service.ts loaded');

const prisma = new PrismaClient();
const inventoryService = new InventoryService(prisma);

cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Fired at', new Date().toISOString());
    try {
      const report = await inventoryService.reconcileInventoryFromCsv(
        './csv/warehouse_counts.csv'
      );
      console.log('[CRON] Report:', report);
    } catch (err) {
      console.error('[CRON] Error:', err);
    }
  },
  {
    timezone: 'Asia/Kolkata',
  }
);
