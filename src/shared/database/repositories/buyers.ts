// src/shared/database/repositories/buyers.ts
import { IBuyersRepository } from '../interfaces';
import { getDb } from '../db';
import { randomUUID } from 'crypto';

export interface BuyerRecord {
  id: string;
  name: string;
  buyerType: string;
  website?: string | null;
  contactEmail?: string | null;
  procurementPortal?: string | null;
  notes?: string | null;
}

export class SqliteBuyersRepository implements IBuyersRepository {
  async getOrCreate(name: string, data?: { buyerType?: string; website?: string }): Promise<{ id: string; name: string }> {
    return BuyersRepository.getOrCreate(name, data);
  }
}

export class BuyersRepository {
  static getByName(name: string): BuyerRecord | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM buyers WHERE name = ?').get(name) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      buyerType: row.buyer_type,
      website: row.website,
      contactEmail: row.contact_email,
      procurementPortal: row.procurement_portal,
      notes: row.notes,
    };
  }

  static getOrCreate(name: string, details?: Partial<BuyerRecord>): BuyerRecord {
    const existing = this.getByName(name);
    if (existing) return existing;

    const db = getDb();
    const id = randomUUID();
    const buyerType = details?.buyerType || 'other';

    db.prepare(`
      INSERT INTO buyers (id, name, buyer_type, website, contact_email, procurement_portal, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      buyerType,
      details?.website || null,
      details?.contactEmail || null,
      details?.procurementPortal || null,
      details?.notes || null
    );

    return {
      id,
      name,
      buyerType,
      website: details?.website || null,
      contactEmail: details?.contactEmail || null,
      procurementPortal: details?.procurementPortal || null,
      notes: details?.notes || null,
    };
  }
}
