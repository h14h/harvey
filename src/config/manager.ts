import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import type { AppConfig } from "../types";

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function getConfigPath(): string {
  const homeDir = Bun.env.HOME ?? process.env.HOME ?? ".";
  return join(homeDir, ".config", "harvey", "config.json");
}

function ensureConfigDirectory(configPath: string): void {
  mkdirSync(dirname(configPath), { recursive: true });
}

export async function loadConfig(): Promise<AppConfig> {
  const configPath = getConfigPath();
  const file = Bun.file(configPath);

  if (!(await file.exists())) {
    return initConfig();
  }

  let data: unknown;
  try {
    data = await file.json();
  } catch (error) {
    throw new ConfigError(`Config file is corrupted: ${configPath}`);
  }

  validateConfig(data);
  return data;
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const configPath = getConfigPath();
  ensureConfigDirectory(configPath);
  await Bun.write(configPath, JSON.stringify(config, null, 2));
}

export async function initConfig(): Promise<AppConfig> {
  const defaults: AppConfig = {
    openai_api_key: "",
    turn_frequency: 6,
  };

  await saveConfig(defaults);
  return defaults;
}

export function validateConfig(config: unknown): config is AppConfig {
  if (typeof config !== "object" || config === null) {
    throw new ConfigError("Config must be an object");
  }

  const candidate = config as Record<string, unknown>;

  if (typeof candidate.openai_api_key !== "string") {
    throw new ConfigError("openai_api_key must be a string");
  }

  if (
    typeof candidate.turn_frequency !== "number" ||
    !Number.isInteger(candidate.turn_frequency) ||
    candidate.turn_frequency < 1
  ) {
    throw new ConfigError("turn_frequency must be a positive integer");
  }

  return true;
}
