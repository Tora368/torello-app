import pg from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL が設定されていません。backend/.env.example を .env にコピーして編集してください。');
  process.exit(1);
}

export const pool = new pg.Pool({ connectionString });
