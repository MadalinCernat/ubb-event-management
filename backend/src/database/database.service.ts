import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  constructor() {
    const connectionString =
      process.env.DATABASE_URL ??
      'postgresql://postgres:password@localhost:5432/postgres';

    super({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async checkConnection(): Promise<{ connected: true; databaseTime: string }> {
    const [result] = await this.$queryRaw<{ databaseTime: Date }[]>`
      SELECT NOW() AS "databaseTime"
    `;

    return {
      connected: true,
      databaseTime: result.databaseTime.toISOString(),
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
