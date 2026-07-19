import { getDb } from '../database/connection.js';
import { nowIso } from '../utils/http.js';

type SettingRow = {
  key: string;
  value: string;
  type: string;
  description: string;
  updated_at: string;
};

const parseValue = (row: SettingRow) => {
  if (row.type === 'number') return Number(row.value);
  if (row.type === 'boolean') return row.value === 'true';
  return row.value;
};

export const settingsRepository = {
  upsert(key: string, value: string, type: string, description: string) {
    getDb()
      .prepare(
        `INSERT INTO system_settings (key, value, type, description, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          type = excluded.type,
          description = excluded.description,
          updated_at = excluded.updated_at`
      )
      .run(key, value, type, description, nowIso());
  },

  list() {
    const rows = getDb()
      .prepare('SELECT * FROM system_settings ORDER BY key')
      .all() as SettingRow[];
    return rows.map((row) => ({
      key: row.key,
      value: parseValue(row),
      rawValue: row.value,
      type: row.type,
      description: row.description,
      updatedAt: row.updated_at
    }));
  },

  getNumber(key: string, fallback: number) {
    const row = getDb()
      .prepare('SELECT * FROM system_settings WHERE key = ?')
      .get(key) as SettingRow | undefined;
    if (!row) return fallback;
    const value = Number(row.value);
    return Number.isFinite(value) ? value : fallback;
  },

  updateFromRecord(settings: Record<string, string | number | boolean>) {
    const existing = this.list();
    for (const setting of existing) {
      if (settings[setting.key] !== undefined) {
        this.upsert(setting.key, String(settings[setting.key]), setting.type, setting.description);
      }
    }
    return this.list();
  }
};
