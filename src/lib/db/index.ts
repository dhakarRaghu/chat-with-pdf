import { neon, neonConfig } from "@neondatabase/serverless"; // ✅ Correct import
import { drizzle } from "drizzle-orm/neon-http"; // ✅ Using neon-http for HTTP pooling

// neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql); 
