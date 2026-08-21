import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('❌ DATABASE_URL غير موجود');
export const sql = neon(connectionString);