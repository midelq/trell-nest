import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * LoggerMiddleware — логує кожен HTTP-запит до API.
 *
 * 📌 Що таке Middleware в NestJS?
 * Middleware — це функція, яка виконується ПЕРЕД Guards, Pipes і Controller.
 * Вона отримує req, res, next — точно як у Express!
 *
 * Ланцюжок запиту:
 *   Middleware → Guard → Interceptor → Pipe → Controller
 *       👆 ми тут
 *
 * 📌 Різниця від Guard:
 * - Middleware НЕ знає, який контролер/метод буде викликано
 * - Middleware НЕ вирішує "пускати чи ні" (хоча технічно може)
 * - Middleware просто обробляє/модифікує req і res
 *
 * 📌 Реєстрація:
 * Middleware реєструється В МОДУЛІ через метод configure() (див. app.module.ts)
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  // Logger — вбудований клас NestJS для красивих логів з кольорами
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    // 1️⃣ Зберігаємо час початку запиту
    const startTime = Date.now();

    // 2️⃣ Дістаємо інфо з запиту
    const { method, originalUrl } = req;
    const userAgent = req.get('user-agent') || 'Unknown';

    // 3️⃣ Коли відповідь буде надіслана клієнту — логуємо результат
    //    res.on('finish') спрацює ПІСЛЯ того, як контролер поверне відповідь
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;

      // Колір залежить від статус-коду
      const logMessage = `${method} ${originalUrl} → ${statusCode} (${duration}ms)`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);     // 🔴 Помилка сервера
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);      // 🟡 Помилка клієнта
      } else {
        this.logger.log(logMessage);       // 🟢 Успіх
      }
    });

    // 4️⃣ ОБОВ'ЯЗКОВО викликаємо next() — інакше запит "зависне"
    //    next() передає запит далі по ланцюжку (до Guard → Pipe → Controller)
    next();
  }
}
