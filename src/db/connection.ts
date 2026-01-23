import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { applySchema } from "./schema";

const defaultDbPath = (() => {
	const homeDir = Bun.env.HOME ?? process.env.HOME ?? ".";
	return join(homeDir, ".local", "share", "harvey", "harvey.db");
})();

function ensureDatabaseDirectory(dbPath: string): void {
	if (dbPath === ":memory:") {
		return;
	}

	mkdirSync(dirname(dbPath), { recursive: true });
}

export function openDatabase(dbPath: string = defaultDbPath): Database {
	ensureDatabaseDirectory(dbPath);
	const db = new Database(dbPath);
	applySchema(db);
	return db;
}

export { defaultDbPath };
