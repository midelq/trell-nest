import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module';

// 📌 APP MODULE — кореневий модуль, збирає все докупи
//
// Порівняння з Express:
// В Express ти підключав все в index.ts:
//   dotenv.config()
//   app.use('/api/boards', boardRoutes)
//   app.use('/api/lists', listRoutes)
//
// В NestJS ти підключаєш модулі:
//   imports: [ConfigModule, DatabaseModule, BoardModule, ...]

@Module({
  imports: [
    // ConfigModule — замінює твій config/env.ts
    // .forRoot() означає: "налаштуй для всього додатку"
    // isGlobal: true — доступний у всіх модулях без повторного import
    ConfigModule.forRoot({
      isGlobal: true,    // не потрібно імпортувати в кожен модуль окремо
      envFilePath: '.env', // читає .env файл (як dotenv.config())
    }),

    // DatabaseModule — замінює твій db/index.ts
    DatabaseModule,

    AuthModule,

    // Тут будуть додаватися модулі:
    // AuthModule,
    // BoardModule,
    // ListModule,
    // CardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
