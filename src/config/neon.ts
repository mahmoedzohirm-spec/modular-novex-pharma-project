// src/config/neon.ts
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.NEON_DATABASE_URL || '';

if (!connectionString) {
  throw new Error('❌ NEON_DATABASE_URL غير موجود في متغيرات البيئة');
}

export const sql = neon(connectionString);