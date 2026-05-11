import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service.js';
import { DATABASE } from './database/database.module.js';
import type { DrizzleDB } from './database/database.module.js';
import { sql } from 'drizzle-orm';

@Controller()
export class AppController {
  // 📌 Dependency Injection в дії!
  //
  // NestJS бачить що конструктор потребує:
  // 1. AppService — шукає провайдер з типом AppService
  // 2. DrizzleDB з токеном DATABASE — шукає провайдер з provide: 'DATABASE'
  //
  // @Inject(DATABASE) потрібен тому що DrizzleDB — це не клас,
  // а тип (type alias). NestJS не може визначити його автоматично.
  // Для класів (як AppService) @Inject не потрібен.
  constructor(
    private readonly appService: AppService,
    @Inject(DATABASE) private readonly db: DrizzleDB,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // 📌 Health check — перевірка що БД працює
  // Аналог твого app.get('/health', ...) з Express
  @Get('health')
  async getHealth() {
    try {
      await this.db.execute(sql`SELECT 1`);
      return {
        status: 'ok',
        database: 'connected ✅',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'error',
        database: 'disconnected ❌',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

