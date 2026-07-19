import { randomUUID } from 'node:crypto';
import { getDb } from '../database/connection.js';
import type { MenuItem, TimeSlot } from '../types/domain.js';
import { nowIso } from '../utils/http.js';

type MenuItemRow = {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  prep_time: number;
  stock: number;
  is_available: number;
  image_url: string;
  created_at: string;
  updated_at: string;
};

type TimeSlotRow = {
  id: string;
  vendor_id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
};

export type MenuItemInput = {
  name: string;
  description: string;
  price: number;
  category: string;
  prepTime: number;
  stock: number;
  isAvailable: boolean;
  imageUrl: string;
};

const mapMenuItem = (row: MenuItemRow): MenuItem => ({
  id: row.id,
  vendorId: row.vendor_id,
  name: row.name,
  description: row.description,
  price: row.price,
  category: row.category,
  prepTime: row.prep_time,
  stock: row.stock,
  isAvailable: row.is_available === 1,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapTimeSlot = (row: TimeSlotRow): TimeSlot => ({
  id: row.id,
  vendorId: row.vendor_id,
  startTime: row.start_time,
  endTime: row.end_time,
  capacity: row.capacity,
  bookedCount: row.booked_count
});

export const menuRepository = {
  create(vendorId: string, input: MenuItemInput) {
    const id = randomUUID();
    const timestamp = nowIso();
    getDb()
      .prepare(
        `INSERT INTO menu_items
         (id, vendor_id, name, description, price, category, prep_time, stock, is_available, image_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        vendorId,
        input.name,
        input.description,
        input.price,
        input.category,
        input.prepTime,
        input.stock,
        input.isAvailable ? 1 : 0,
        input.imageUrl,
        timestamp,
        timestamp
      );
    return this.findById(id)!;
  },

  update(id: string, input: Partial<MenuItemInput>) {
    const current = this.findById(id);
    if (!current) return null;
    const updated = { ...current, ...input };
    getDb()
      .prepare(
        `UPDATE menu_items
         SET name = ?, description = ?, price = ?, category = ?, prep_time = ?, stock = ?,
             is_available = ?, image_url = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        updated.name,
        updated.description,
        updated.price,
        updated.category,
        updated.prepTime,
        updated.stock,
        updated.isAvailable ? 1 : 0,
        updated.imageUrl,
        nowIso(),
        id
      );
    return this.findById(id);
  },

  remove(id: string) {
    getDb().prepare('DELETE FROM menu_items WHERE id = ?').run(id);
  },

  findById(id: string) {
    const row = getDb().prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as MenuItemRow | undefined;
    return row ? mapMenuItem(row) : null;
  },

  listByVendor(vendorId: string) {
    const rows = getDb()
      .prepare('SELECT * FROM menu_items WHERE vendor_id = ? ORDER BY category, name')
      .all(vendorId) as MenuItemRow[];
    return rows.map(mapMenuItem);
  },

  listPublic() {
    const rows = getDb()
      .prepare(
        `SELECT mi.*, v.outlet_name, v.location, v.avg_rating
         FROM menu_items mi
         JOIN vendors v ON v.id = mi.vendor_id
         ORDER BY v.outlet_name, mi.category, mi.name`
      )
      .all() as Array<MenuItemRow & { outlet_name: string; location: string; avg_rating: number }>;

    return rows.map((row) => ({
      ...mapMenuItem(row),
      vendorName: row.outlet_name,
      vendorLocation: row.location,
      vendorRating: row.avg_rating
    }));
  },

  findMany(ids: string[]) {
    if (!ids.length) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const rows = getDb()
      .prepare(`SELECT * FROM menu_items WHERE id IN (${placeholders})`)
      .all(...ids) as MenuItemRow[];
    return rows.map(mapMenuItem);
  },

  decrementStock(itemId: string, quantity: number) {
    getDb()
      .prepare(
        `UPDATE menu_items
         SET stock = stock - ?, is_available = CASE WHEN stock - ? <= 0 THEN 0 ELSE is_available END, updated_at = ?
         WHERE id = ? AND stock >= ?`
      )
      .run(quantity, quantity, nowIso(), itemId, quantity);
  },

  createTimeSlot(input: Omit<TimeSlot, 'id' | 'bookedCount'> & { bookedCount?: number }) {
    const id = randomUUID();
    getDb()
      .prepare(
        `INSERT INTO time_slots (id, vendor_id, start_time, end_time, capacity, booked_count)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.vendorId, input.startTime, input.endTime, input.capacity, input.bookedCount ?? 0);
    return id;
  },

  listTimeSlots(vendorId?: string) {
    const sql = vendorId
      ? 'SELECT * FROM time_slots WHERE vendor_id = ? ORDER BY start_time'
      : 'SELECT * FROM time_slots ORDER BY vendor_id, start_time';
    const rows = vendorId
      ? (getDb().prepare(sql).all(vendorId) as TimeSlotRow[])
      : (getDb().prepare(sql).all() as TimeSlotRow[]);
    return rows.map(mapTimeSlot);
  },

  bookSlot(slotId: string) {
    getDb()
      .prepare('UPDATE time_slots SET booked_count = booked_count + 1 WHERE id = ? AND booked_count < capacity')
      .run(slotId);
  }
};
