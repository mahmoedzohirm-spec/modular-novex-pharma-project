// لا تستورد dotenv
import { neon } from '@neondatabase/serverless';

// استخدم import.meta.env (Vite)
const connectionString = import.meta.env.VITE_DATABASE_URL;
if (!connectionString) throw new Error('❌ DATABASE_URL غير موجود في .env');
export const sql = neon(connectionString);
