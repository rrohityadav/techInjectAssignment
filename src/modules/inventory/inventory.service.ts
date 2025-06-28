

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

export interface ReconciliationRow {
  sku: string;
  stock: number;
}

export interface ReconciliationReport {
  stockExportTime?: string;
  validRows: ReconciliationRow[];
  unparsedRows: string[];
}
export class InventoryService {
  constructor(private readonly prisma: PrismaClient) {}

  async reconcileInventoryFromCsv(csvPath: string): Promise<ReconciliationReport> {

    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '');

    const validRows: ReconciliationRow[] = [];
    const unparsedRows: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      try {
        const [sku, stockStr] = parse(line, { delimiter: ',', trim: true })[0];
        const stock = Number(stockStr);
        if (!sku || isNaN(stock)) throw new Error();
        validRows.push({ sku, stock });
      } catch {
        if (i < lines.length - 1) {
          unparsedRows.push(line);
        }
      }
    }
    let stockExportTime: string | undefined;
    const footerMatch = lines[lines.length - 1].match(
      /^id=(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z),stock=(\d{2}:\d{2})$/
    );
    if (footerMatch) {
      stockExportTime = footerMatch[2];
      if (
        validRows.length &&
        validRows[validRows.length - 1].sku.startsWith('id=')
      ) {
        validRows.pop();
      }
    }
    await this.prisma.$transaction(
      validRows.map((row) =>
        this.prisma.productVariation.update({
          where: { sku: row.sku },
          data: { stock: row.stock },
        })
      )
    );
    return {
      stockExportTime,
      validRows,
      unparsedRows,
    };
  }
}
