import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import 'dotenv/config';

// 创建数据库连接
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// 导出类型
export type Database = typeof db; 