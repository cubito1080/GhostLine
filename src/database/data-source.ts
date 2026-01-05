import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as entities from './entities';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'ghostline',
  password: process.env.DB_PASSWORD || 'ghostline_dev_password',
  database: process.env.DB_NAME || 'ghostline_tattoo',
  entities: Object.values(entities),
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
