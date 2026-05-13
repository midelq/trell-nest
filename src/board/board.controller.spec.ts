/**
 * 📌 UNIT ТЕСТИ ДЛЯ BoardController
 *
 * Різниця від тестів BoardService:
 * - В BoardService ми мокали базу даних (DATABASE)
 * - В BoardController ми мокаємо BoardService та ActivityService
 *
 * Чому? Бо ми тестуємо ТІЛЬКИ логіку контролера:
 * - Чи правильно він викликає сервіс?
 * - Чи повертає правильну відповідь?
 * - Чи кидає NotFoundException коли треба?
 *
 * Нас НЕ цікавить, як працює BoardService всередині — це вже протестовано окремо.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { ActivityService } from '../activity/activity.service';

describe('BoardController', () => {
  let controller: BoardController;
  let mockBoardService: any;
  let mockActivityService: any;

  beforeEach(async () => {
    // ===========================
    // 1️⃣ СТВОРЮЄМО МОКИ СЕРВІСІВ
    // ===========================
    // jest.fn() створює "шпигунську" функцію.
    // Ми можемо:
    //   - налаштувати що вона повертає (.mockResolvedValue)
    //   - перевірити чи вона була викликана (expect(...).toHaveBeenCalled)
    //   - перевірити з якими аргументами (expect(...).toHaveBeenCalledWith)

    mockBoardService = {
      findAllByOwner: jest.fn(),
      findByIdAndOwner: jest.fn(),
      findFullByIdAndOwner: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockActivityService = {
      logActivity: jest.fn().mockResolvedValue(undefined),
    };

    // ===========================
    // 2️⃣ СТВОРЮЄМО ТЕСТОВИЙ МОДУЛЬ
    // ===========================
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardController],
      providers: [
        // Замість реального BoardService — наш мок
        { provide: BoardService, useValue: mockBoardService },
        // Замість реального ActivityService — наш мок
        { provide: ActivityService, useValue: mockActivityService },
      ],
    }).compile();

    controller = module.get<BoardController>(BoardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ----- getAllBoards -----

  describe('getAllBoards', () => {
    it('should return all boards for current user', async () => {
      // Arrange
      const mockUser = { userId: 1, email: 'test@test.com', fullName: 'Test' };
      const mockBoards = [
        { id: 1, title: 'Board 1', ownerId: 1 },
        { id: 2, title: 'Board 2', ownerId: 1 },
      ];
      mockBoardService.findAllByOwner.mockResolvedValue(mockBoards);

      // Act
      const result = await controller.getAllBoards(mockUser);

      // Assert
      expect(result.boards).toEqual(mockBoards);
      expect(result.count).toBe(2);
      // Перевіряємо, що сервіс був викликаний з правильним userId
      expect(mockBoardService.findAllByOwner).toHaveBeenCalledWith(1);
    });

    it('should return message when no boards exist', async () => {
      // Arrange
      const mockUser = { userId: 1, email: 'test@test.com', fullName: 'Test' };
      mockBoardService.findAllByOwner.mockResolvedValue([]);

      // Act
      const result = await controller.getAllBoards(mockUser);

      // Assert
      expect(result.boards).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.message).toBe('No boards created yet');
    });
  });

  // ----- getBoardById -----

  describe('getBoardById', () => {
    it('should return board when found', async () => {
      // Arrange
      const mockUser = { userId: 1, email: 'test@test.com', fullName: 'Test' };
      const mockBoard = { id: 1, title: 'My Board', ownerId: 1 };
      mockBoardService.findByIdAndOwner.mockResolvedValue(mockBoard);

      // Act
      const result = await controller.getBoardById(1, mockUser);

      // Assert
      expect(result.board).toEqual(mockBoard);
    });

    it('should throw NotFoundException when board not found', async () => {
      // Arrange
      const mockUser = { userId: 1, email: 'test@test.com', fullName: 'Test' };
      mockBoardService.findByIdAndOwner.mockResolvedValue(null);

      // Act & Assert
      // 📌 Для тестування помилок використовуємо rejects.toThrow()
      await expect(controller.getBoardById(999, mockUser))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  // ----- createBoard -----

  describe('createBoard', () => {
    it('should create a board and log activity', async () => {
      // Arrange
      const mockUser = { userId: 1 };
      const mockBoard = { id: 1, title: 'New Board', ownerId: 1 };
      mockBoardService.create.mockResolvedValue(mockBoard);

      // Act
      const result = await controller.createBoard({ title: 'New Board' }, mockUser);

      // Assert
      expect(result.message).toBe('Board created successfully');
      expect(result.board).toEqual(mockBoard);

      // 📌 Перевіряємо, що активність була залогована!
      expect(mockActivityService.logActivity).toHaveBeenCalledWith({
        type: 'board_created',
        description: 'Created board "New Board"',
        userId: 1,
        boardId: 1,
      });
    });
  });

  // ----- deleteBoard -----

  describe('deleteBoard', () => {
    it('should delete board and log activity', async () => {
      // Arrange
      const mockUser = { userId: 1 };
      const mockBoard = { id: 1, title: 'Board to delete', ownerId: 1 };
      mockBoardService.findByIdAndOwner.mockResolvedValue(mockBoard);
      mockBoardService.delete.mockResolvedValue(true);

      // Act
      const result = await controller.deleteBoard(1, mockUser);

      // Assert
      expect(result.message).toBe('Board deleted successfully');
      expect(mockActivityService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'board_deleted',
          userId: 1,
        })
      );
    });

    it('should throw NotFoundException when deleting non-existent board', async () => {
      // Arrange
      const mockUser = { userId: 1 };
      mockBoardService.findByIdAndOwner.mockResolvedValue(null);
      mockBoardService.delete.mockResolvedValue(false);

      // Act & Assert
      await expect(controller.deleteBoard(999, mockUser))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
