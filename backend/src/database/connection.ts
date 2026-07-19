import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '../config/env.js';
import { schemaSql } from './schema.js';

let db: DatabaseSync | null = null;

export const getDb = () => {
  if (!db) {
    mkdirSync(dirname(env.databaseUrl), { recursive: true });
    db = new DatabaseSync(env.databaseUrl);
    db.exec(schemaSql);
  }

  return db;
};

export const resetDatabase = () => {
  const database = getDb();
  database.exec(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM reviews;
    DELETE FROM queue_tickets;
    DELETE FROM payments;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM time_slots;
    DELETE FROM menu_items;
    DELETE FROM staff;
    DELETE FROM admins;
    DELETE FROM vendors;
    DELETE FROM students;
    DELETE FROM system_settings;
    DELETE FROM users;
    PRAGMA foreign_keys = ON;
  `);
};
