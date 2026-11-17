import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './auth/public.decorator.js';
import { DatabaseService } from './database/database.service.js';

@Public()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health/database')
  getDatabaseHealth(): Promise<{ connected: true; databaseTime: string }> {
    return this.databaseService.checkConnection();
  }
}
