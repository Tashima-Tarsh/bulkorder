import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { createDb } from "./db.js";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(here, "schema.sql");
const config = loadConfig();
const db = createDb(config);
try {
  const sql = await readFile(schemaPath, "utf8");
  await db.query(sql);
  console.log("Database schema ready");
} finally {
  await db.end();
}
