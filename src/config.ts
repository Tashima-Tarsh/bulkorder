import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  DOWNSTREAM_ORDER_API_URL: z.string().url().optional().or(z.literal("")),
  DOWNSTREAM_ORDER_API_TOKEN: z.string().optional()
});

export type Config = z.infer<typeof schema>;
export const loadConfig = (): Config => schema.parse(process.env);
