import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module';
import { BoardModule } from './board/board.module';
import { ListModule } from './list/list.module';
import { CardModule } from './card/card.module';
import { EmailModule } from './email/email.module';
import { ActivityModule } from './activity/activity.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

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

    BoardModule,

    ListModule,

    CardModule,

    EmailModule,

    ActivityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

// 📌 РЕЄСТРАЦІЯ MIDDLEWARE
//
// В Express ти писав:           app.use(morgan('dev'))
// В NestJS ти реєструєш тут:   consumer.apply(LoggerMiddleware).forRoutes('*')
//
// Різниця:
// - В Express middleware завжди глобальна (або прив'язана до роуту)
// - В NestJS ти можеш точно контролювати:
//     .forRoutes('boards')           — тільки для /boards
//     .forRoutes(BoardController)    — тільки для BoardController
//     .forRoutes('*')                — для ВСІХ роутів
//     .exclude('auth')               — для всіх, КРІМ /auth
//
// 📌 Щоб це працювало, клас повинен implements NestModule
//    і мати метод configure()
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)  // 👈 Яку middleware застосувати
      .forRoutes('(.*)');          // 👈 До яких роутів (всі роути)
  }
}
