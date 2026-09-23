import pg from "pg";
import type { Config } from "./config.js";

export function createDb(config: Config) {
  return new pg.Pool({
    connectionString: config.DATABASE_URL,
    max: 10,
    ssl: config.DATABASE_URL.includes("localhost") || config.DATABASE_URL.includes("@db:") ? false : undefined
  });
}
export type Db = ReturnType<typeof createDb>;
