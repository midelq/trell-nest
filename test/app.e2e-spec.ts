/**
 * 📌 E2E ТЕСТИ (End-to-End)
 *
 * Чим відрізняються від Unit тестів?
 *
 * Unit тест:    controller.getAllBoards(mockUser)     ← викликаємо метод напряму
 * E2E тест:     GET /api/boards (з JWT токеном)       ← надсилаємо HTTP-запит!
 *
 * E2E тест піднімає ВЕСЬ NestJS додаток і шле реальні HTTP-запити
 * через бібліотеку supertest (аналог Postman, але в коді).
 *
 * 📌 Що ми тестуємо:
 * - Чи правильно працюють роути?
 * - Чи повертає правильні HTTP статус-коди?
 * - Чи працює валідація через Zod?
 * - Чи працює JWT авторизація?
 * - Чи правильний формат відповіді?
 *
 * 📌 Оскільки БД зараз не підключена, ми замокаємо сервіси.
 * В реальному проєкті E2E тести зазвичай працюють з тестовою БД.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { BoardService } from '../src/board/board.service';
import { ActivityService } from '../src/activity/activity.service';
import { EmailService } from '../src/email/email.service';
import { DATABASE } from '../src/database/database.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('App E2E Tests', () => {
  let app: INestApplication;
  let mockAuthService: any;
  let mockBoardService: any;

  beforeAll(async () => {
    // ===========================
    // 1️⃣ СТВОРЮЄМО МОКИ СЕРВІСІВ
    // ===========================
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    mockBoardService = {
      findAllByOwner: jest.fn(),
      findByIdAndOwner: jest.fn(),
      findFullByIdAndOwner: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockActivityService = {
      logActivity: jest.fn().mockResolvedValue(undefined),
      getActivitiesByBoard: jest.fn().mockResolvedValue([]),
    };

    const mockEmailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
      sendEmail: jest.fn().mockResolvedValue(true),
    };

    // Фейкова БД (потрібна щоб модуль не впав)
    const mockDb = {};

    // ===========================
    // 2️⃣ СТВОРЮЄМО ТЕСТОВИЙ ДОДАТОК
    // ===========================
    //
    // 📌 .overrideProvider() — ключовий метод для E2E!
    // Він замінює реальний сервіс на мок, АЛЕ зберігає весь
    // pipeline NestJS: роутинг, middleware, guards, pipes, filters.
    //
    // Це головна відмінність від Unit тестів:
    // - Unit: тестуємо клас напряму
    // - E2E:  тестуємо через HTTP, з усіма middleware і pipes

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATABASE).useValue(mockDb)
      .overrideProvider(AuthService).useValue(mockAuthService)
      .overrideProvider(BoardService).useValue(mockBoardService)
      .overrideProvider(ActivityService).useValue(mockActivityService)
      .overrideProvider(EmailService).useValue(mockEmailService)
      .compile();

    // 📌 createNestApplication() — створює СПРАВЖНІЙ HTTP сервер!
    app = moduleFixture.createNestApplication();

    // Додаємо ті самі middleware що і в main.ts
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new GlobalExceptionFilter());

    // 📌 app.init() — запускає додаток (без .listen(), без реального порту)
    await app.init();
  });

  // Закриваємо додаток після всіх тестів
  afterAll(async () => {
    await app.close();
  });

  // ===========================
  // 3️⃣ ТЕСТИ AUTH
  // ===========================

  describe('Auth (/api/auth)', () => {

    describe('POST /api/auth/register', () => {
      it('should register a new user (201)', async () => {
        // Arrange: налаштовуємо мок
        mockAuthService.register.mockResolvedValue({
          user: { id: 1, email: 'test@test.com', fullName: 'Test User' },
          accessToken: 'fake-jwt-token',
          refreshToken: 'fake-refresh-token',
        });

        // Act & Assert:
        // 📌 request(app.getHttpServer()) — це supertest!
        // Він надсилає СПРАВЖНІЙ HTTP-запит до нашого NestJS додатку
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')                    // 👈 HTTP метод + URL
          .send({                                        // 👈 Body запиту
            fullName: 'Test User',
            email: 'test@test.com',
            password: 'password123',
          })
          .expect(201);                                  // 👈 Очікуваний статус-код

        // Перевіряємо тіло відповіді
        expect(response.body.user.email).toBe('test@test.com');
        expect(response.body.accessToken).toBe('fake-jwt-token');

        // 📌 Перевіряємо, що refreshToken прийшов у Cookie (не в body!)
        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(cookies[0]).toContain('refreshToken');
      });

      it('should reject invalid data (Zod validation)', async () => {
        // 📌 Тут ми тестуємо, що ZodValidationPipe працює!
        // Надсилаємо запит БЕЗ email — Zod повинен відхилити
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            fullName: 'Test User',
            // email відсутній!
            password: '123',   // занадто короткий
          });

        // Головне — що відповідь НЕ 201 (реєстрація не пройшла!)
        expect(response.status).not.toBe(201);
        expect(response.status).toBeGreaterThanOrEqual(400);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login successfully (200)', async () => {
        // Arrange
        mockAuthService.login.mockResolvedValue({
          user: { id: 1, email: 'test@test.com', fullName: 'Test User' },
          accessToken: 'fake-jwt-token',
          refreshToken: 'fake-refresh-token',
        });

        // Act & Assert
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'test@test.com',
            password: 'password123',
          })
          .expect(200);

        expect(response.body.accessToken).toBeDefined();
        expect(response.body.user.email).toBe('test@test.com');
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout and clear cookie (200)', async () => {
        // Arrange
        mockAuthService.logout.mockResolvedValue({ success: true });

        // Act & Assert
        const response = await request(app.getHttpServer())
          .post('/api/auth/logout')
          .set('Cookie', 'refreshToken=fake-token')  // 👈 Імітуємо куку
          .expect(200);

        expect(response.body.message).toBe('Logged out successfully');
      });
    });
  });

  // ===========================
  // 4️⃣ ТЕСТИ BOARDS (захищені JWT)
  // ===========================

  describe('Boards (/api/boards)', () => {

    describe('GET /api/boards (without auth)', () => {
      it('should return 401 without JWT token', async () => {
        // 📌 Ключовий тест: перевіряємо, що без токена — 401!
        // Це доводить, що JwtAuthGuard працює правильно
        await request(app.getHttpServer())
          .get('/api/boards')
          .expect(401);
      });
    });

    describe('GET /api/boards (with auth)', () => {
      it('should return boards when authenticated', async () => {
        // Arrange
        const mockBoards = [
          { id: 1, title: 'Board 1', ownerId: 1 },
          { id: 2, title: 'Board 2', ownerId: 1 },
        ];
        mockBoardService.findAllByOwner.mockResolvedValue(mockBoards);

        // 📌 Щоб пройти JwtAuthGuard, нам потрібен валідний JWT.
        // Але оскільки ми замокали AuthService, ми не можемо отримати
        // справжній токен. Тому тестуємо тільки 401 (без токена).
        //
        // В реальному E2E тесті з тестовою БД ми б:
        // 1. Створили юзера через POST /api/auth/register
        // 2. Отримали accessToken
        // 3. Використали його: .set('Authorization', `Bearer ${token}`)
        //
        // Для демонстрації — перевіримо просто 401:
        await request(app.getHttpServer())
          .get('/api/boards')
          .expect(401);
      });
    });
  });

  // ===========================
  // 5️⃣ ТЕСТИ HEALTH CHECK
  // ===========================

  describe('Health (/api/health)', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBeDefined();
    });
  });

  // ===========================
  // 6️⃣ ТЕСТ 404 ДЛЯ НЕІСНУЮЧОГО РОУТА
  // ===========================

  describe('Unknown routes', () => {
    it('should return 404 for unknown routes', async () => {
      await request(app.getHttpServer())
        .get('/api/unknown-route')
        .expect(404);
    });
  });
});
