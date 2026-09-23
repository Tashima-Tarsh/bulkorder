import { loadConfig } from "./config.js";
import { createDb } from "./db.js";
import { schemaSql } from "./schema.js";

const config = loadConfig();
const db = createDb(config);
try {
  await db.query(schemaSql);
  console.log("Database schema ready");
} finally {
  await db.end();
}
