/**
 * 📌 UNIT ТЕСТИ ДЛЯ BoardService
 *
 * Що таке Unit Test?
 * Unit test перевіряє ОДИН клас (одну "одиницю") в ізоляції.
 * Ми тестуємо BoardService, але НЕ підключаємо реальну базу даних.
 * Замість справжньої БД ми створюємо "мок" (підробку).
 *
 * 📌 Ключові концепції NestJS тестування:
 *
 * 1. Test.createTestingModule() — створює "міні-додаток" тільки для тесту
 * 2. Mock (мок) — підробний об'єкт, який імітує реальну залежність
 * 3. jest.fn() — створює "шпигунську" функцію, яку можна налаштувати
 *
 * 📌 Паттерн AAA (Arrange-Act-Assert):
 * - Arrange: підготувати дані та моки
 * - Act: викликати метод, який тестуємо
 * - Assert: перевірити результат
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { DATABASE } from '../database/database.module';

// ===========================
// 1️⃣ СТВОРЮЄМО МОК БАЗИ ДАНИХ
// ===========================
// Замість реального Drizzle ORM, ми створюємо фейковий об'єкт
// який повертає те, що ми скажемо. Це і є "mock" (мок).

// Допоміжна функція для створення ланцюжка Drizzle-методів
// Drizzle використовує паттерн builder: db.select().from().where().limit()
// Нам потрібно замокати КОЖЕН метод у ланцюжку
function createChainMock(resolvedValue: any) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(resolvedValue),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue(resolvedValue),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };
  return chain;
}

describe('BoardService', () => {
  let service: BoardService;
  let mockDb: any;

  // ===========================
  // 2️⃣ НАЛАШТУВАННЯ ПЕРЕД КОЖНИМ ТЕСТОМ
  // ===========================
  // beforeEach() запускається ПЕРЕД кожним it()
  // Це гарантує, що кожен тест починає з чистого стану

  beforeEach(async () => {
    // Створюємо мок бази даних
    mockDb = createChainMock([]);

    // 📌 Test.createTestingModule() — ГОЛОВНА МАГІЯ NestJS тестування!
    // Це створює "міні-NestJS додаток" тільки для тесту.
    //
    // Замість реального DATABASE ми підставляємо наш mockDb:
    //   { provide: DATABASE, useValue: mockDb }
    //
    // Це і є Dependency Injection у дії:
    // BoardService просить DATABASE → NestJS дає йому наш мок
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: DATABASE,      // 👈 Що замінюємо
          useValue: mockDb,       // 👈 На що замінюємо (наш фейк)
        },
      ],
    }).compile();

    // Дістаємо екземпляр BoardService з тестового модуля
    service = module.get<BoardService>(BoardService);
  });

  // ===========================
  // 3️⃣ ТЕСТИ
  // ===========================

  // Найпростіший тест — чи сервіс взагалі створився
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ----- findAllByOwner -----

  describe('findAllByOwner', () => {
    it('should return boards for a given owner', async () => {
      // Arrange: підготовка даних
      const mockBoards = [
        { id: 1, title: 'Board 1', ownerId: 1, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, title: 'Board 2', ownerId: 1, createdAt: new Date(), updatedAt: new Date() },
      ];

      // Налаштовуємо мок: коли хтось викличе .where(), повернути наші дошки
      // mockReturnThis() означає "поверни сам себе" (для ланцюжка)
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValue(mockBoards);

      // Act: викликаємо метод, який тестуємо
      const result = await service.findAllByOwner(1);

      // Assert: перевіряємо результат
      expect(result).toEqual(mockBoards);
      expect(result).toHaveLength(2);

      // Перевіряємо, що метод select() був викликаний
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return empty array when user has no boards', async () => {
      // Arrange
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValue([]);

      // Act
      const result = await service.findAllByOwner(999);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  // ----- findByIdAndOwner -----

  describe('findByIdAndOwner', () => {
    it('should return a board when found', async () => {
      // Arrange
      const mockBoard = { id: 1, title: 'My Board', ownerId: 1, createdAt: new Date(), updatedAt: new Date() };

      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValue([mockBoard]);

      // Act
      const result = await service.findByIdAndOwner(1, 1);

      // Assert
      expect(result).toEqual(mockBoard);
    });

    it('should return null when board not found', async () => {
      // Arrange
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValue([]);

      // Act
      const result = await service.findByIdAndOwner(999, 1);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ----- create -----

  describe('create', () => {
    it('should create and return a new board', async () => {
      // Arrange
      const mockBoard = { id: 1, title: 'New Board', ownerId: 1, createdAt: new Date(), updatedAt: new Date() };

      mockDb.insert.mockReturnThis();
      mockDb.values.mockReturnThis();
      mockDb.returning.mockResolvedValue([mockBoard]);

      // Act
      const result = await service.create('New Board', 1);

      // Assert
      expect(result).toEqual(mockBoard);
      expect(result.title).toBe('New Board');
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  // ----- update -----

  describe('update', () => {
    it('should update and return the board', async () => {
      // Arrange
      const existingBoard = { id: 1, title: 'Old Title', ownerId: 1, createdAt: new Date(), updatedAt: new Date() };
      const updatedBoard = { ...existingBoard, title: 'New Title', updatedAt: new Date() };

      // Перший виклик — findByIdAndOwner (перевірка чи існує)
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValueOnce([existingBoard]); // 👈 Once = тільки перший раз

      // Другий виклик — update
      mockDb.update.mockReturnThis();
      mockDb.set.mockReturnThis();
      // .where після update
      mockDb.where.mockReturnThis();
      mockDb.returning.mockResolvedValue([updatedBoard]);

      // Act
      const result = await service.update(1, 1, 'New Title');

      // Assert
      expect(result).toEqual(updatedBoard);
      expect(result?.title).toBe('New Title');
    });

    it('should return null when board does not exist', async () => {
      // Arrange: findByIdAndOwner повертає порожній масив (дошка не знайдена)
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValue([]);

      // Act
      const result = await service.update(999, 1, 'New Title');

      // Assert
      expect(result).toBeNull();
      // Переконуємось, що update НЕ був викликаний (бо дошки немає)
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });

  // ----- delete -----

  describe('delete', () => {
    it('should return true when board deleted successfully', async () => {
      // Arrange
      const existingBoard = { id: 1, title: 'Board', ownerId: 1, createdAt: new Date(), updatedAt: new Date() };

      // Мокаємо ланцюжок для findByIdAndOwner (select → from → where → limit)
      const whereMock = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([existingBoard])
      });
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: whereMock
        })
      });

      // Мокаємо ланцюжок для delete (delete → where)
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      });

      // Act
      const result = await service.delete(1, 1);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when board not found', async () => {
      // Arrange
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValue([]);

      // Act
      const result = await service.delete(999, 1);

      // Assert
      expect(result).toBe(false);
    });
  });
});
