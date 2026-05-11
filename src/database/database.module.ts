// 📌 DATABASE MODULE — обгортка Drizzle для NestJS Dependency Injection
//
// В Express ти мав db/index.ts де створювався глобальний `db` через Proxy.
// В NestJS ми робимо те саме, але через модульну систему:
//
// 1. Створюємо "провайдер" — об'єкт, який NestJS зберігає і роздає іншим
// 2. Використовуємо токен 'DATABASE' для ін'єкції
// 3. @Global() робить модуль доступним СКРІЗЬ без явного imports

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Токен для Dependency Injection
// Замість import { db } from './db' — тепер @Inject(DATABASE) private db
export const DATABASE = 'DATABASE';

// Тип бази даних для TypeScript
export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

@Global()   // 🆕 Робить цей модуль доступним у ВСІХ інших модулях без явного import
@Module({
  providers: [
    {
      // --- Це "кастомний провайдер" ---
      // В NestJS є 2 типи провайдерів:
      //
      // 1. Простий: providers: [BoardService]
      //    NestJS сам створить new BoardService()
      //
      // 2. Кастомний (як тут): ти сам описуєш КАК створити об'єкт
      //    useFactory — це функція, яка повертає значення провайдера

      provide: DATABASE,        // токен — по ньому інші сервіси будуть просити цей об'єкт
      inject: [ConfigService],  // що потрібно цій фабриці (NestJS підставить автоматично)

      useFactory: (configService: ConfigService) => {
        // configService.getOrThrow() — бере значення з .env
        // Аналог твого env.DATABASE_URL з config/env.ts
        const connectionString = configService.getOrThrow<string>('DATABASE_URL');

        // Створюємо postgres-клієнт (таке саме як в Express)
        const client = postgres(connectionString, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        });

        // Створюємо drizzle-інстанс (таке саме як в Express)
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DATABASE],  // Експортуємо, щоб інші модулі могли використовувати
})
export class DatabaseModule {}
