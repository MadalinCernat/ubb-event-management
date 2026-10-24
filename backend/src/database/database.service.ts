import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      'postgresql://postgres:password@localhost:5432/postgres',
  });

  async checkConnection(): Promise<{ connected: true; databaseTime: string }> {
    const result = await this.pool.query<{ database_time: Date }>(
      'SELECT NOW() AS database_time',
    );

    return {
      connected: true,
      databaseTime: result.rows[0].database_time.toISOString(),
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
