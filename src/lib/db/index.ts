import {neon , neonConfig} from '@neondatabase/serverless';   // to connect ne on to drizzle orm
import { drizzle } from "drizzle-orm/neon-http";

// neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql); 
