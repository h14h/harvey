import type { Database } from "bun:sqlite";

import type { GlobalConfig } from "../../types";

export interface GlobalConfigRepository {
  get(): GlobalConfig;
  updateGlobalTone(tone: string): void;
  updateGlobalToneSummary(summary: string): void;
  clearGlobalTone(): void;
}

type GlobalConfigRow = {
  id: 1;
  global_tone: string | null;
  global_tone_summary: string | null;
  updated_at: number;
};

function toGlobalConfig(row: GlobalConfigRow): GlobalConfig {
  return {
    id: row.id,
    globalTone: row.global_tone,
    globalToneSummary: row.global_tone_summary,
    updatedAt: row.updated_at,
  };
}

export function createGlobalConfigRepository(
  db: Database
): GlobalConfigRepository {
  const insertConfig = db.prepare(
    `INSERT OR IGNORE INTO global_config (id, global_tone, global_tone_summary, updated_at)
     VALUES (1, NULL, NULL, ?)`
  );
  const getQuery = db.prepare(
    `SELECT id, global_tone, global_tone_summary, updated_at
     FROM global_config WHERE id = 1`
  );
  const updateGlobalToneQuery = db.prepare(
    `UPDATE global_config SET global_tone = ?, updated_at = ? WHERE id = 1`
  );
  const updateGlobalToneSummaryQuery = db.prepare(
    `UPDATE global_config SET global_tone_summary = ?, updated_at = ? WHERE id = 1`
  );
  const clearGlobalToneQuery = db.prepare(
    `UPDATE global_config
     SET global_tone = NULL, global_tone_summary = NULL, updated_at = ?
     WHERE id = 1`
  );

  function ensureRow(): GlobalConfigRow {
    const now = Date.now();
    insertConfig.run(now);
    const row = getQuery.get() as GlobalConfigRow | null;

    if (!row) {
      throw new Error("Global config not initialized");
    }

    return row;
  }

  return {
    get() {
      return toGlobalConfig(ensureRow());
    },
    updateGlobalTone(tone) {
      ensureRow();
      const now = Date.now();
      const result = updateGlobalToneQuery.run(tone, now);

      if (result.changes === 0) {
        throw new Error("Global config update failed");
      }
    },
    updateGlobalToneSummary(summary) {
      ensureRow();
      const now = Date.now();
      const result = updateGlobalToneSummaryQuery.run(summary, now);

      if (result.changes === 0) {
        throw new Error("Global config update failed");
      }
    },
    clearGlobalTone() {
      ensureRow();
      const now = Date.now();
      const result = clearGlobalToneQuery.run(now);

      if (result.changes === 0) {
        throw new Error("Global config update failed");
      }
    },
  };
}
