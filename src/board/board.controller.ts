import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, UsePipes, NotFoundException } from '@nestjs/common';
import { BoardService } from './board.service.js';
import { ActivityService } from '../activity/activity.service.js';
import { CreateBoardDto, UpdateBoardDto, createBoardSchema, updateBoardSchema } from './dto/board.dto.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('boards')
@ApiBearerAuth() // Вказує Swagger, що всі ендпоінти тут захищені JWT
@UseGuards(JwtAuthGuard) // 👈 Захищає ВСІ роути в цьому контролері
@Controller('boards')
export class BoardController {
  constructor(
    private readonly boardService: BoardService,
    private readonly activityService: ActivityService,
  ) {}

  @ApiOperation({ summary: 'Отримати всі дошки користувача' })
  @Get()
  async getAllBoards(@CurrentUser() user: JwtPayload) {
    const boards = await this.boardService.findAllByOwner(user.userId);
    return {
      boards,
      count: boards.length,
      message: boards.length === 0 ? 'No boards created yet' : undefined,
    };
  }

  @ApiOperation({ summary: 'Отримати дошку за ID' })
  @Get(':id')
  async getBoardById(
    @Param('id', ParseIntPipe) id: number, // 👈 NestJS сам перетворить рядок в число
    @CurrentUser() user: JwtPayload,
  ) {
    const board = await this.boardService.findByIdAndOwner(id, user.userId);
    
    if (!board) {
      throw new NotFoundException('Board not found or you do not have access');
    }
    
    return { board };
  }

  @ApiOperation({ summary: 'Отримати повну дошку (зі списками і картками)' })
  @Get(':id/full')
  async getBoardFull(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const board = await this.boardService.findFullByIdAndOwner(id, user.userId);
    
    if (!board) {
      throw new NotFoundException('Board not found or you do not have access');
    }
    
    return { board };
  }

  @ApiOperation({ summary: 'Створити нову дошку' })
  @Post()
  @UsePipes(new ZodValidationPipe(createBoardSchema))
  async createBoard(@Body() body: CreateBoardDto, @CurrentUser() user: { userId: number }) {
    const newBoard = await this.boardService.create(body.title, user.userId);
    
    await this.activityService.logActivity({
      type: 'board_created',
      description: `Created board "${newBoard.title}"`,
      userId: user.userId,
      boardId: newBoard.id
    });

    return {
      message: 'Board created successfully',
      board: newBoard,
    };
  }

  @ApiOperation({ summary: 'Оновити дошку' })
  @Put(':id')
  @UsePipes(new ZodValidationPipe(updateBoardSchema))
  async updateBoard(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateBoardDto,
    @CurrentUser() user: { userId: number },
  ) {
    const updatedBoard = await this.boardService.update(id, user.userId, body.title!);

    if (!updatedBoard) {
      throw new NotFoundException('Board not found or you do not have permission to edit it');
    }
    
    await this.activityService.logActivity({
      type: 'board_updated',
      description: `Updated board "${updatedBoard.title}"`,
      userId: user.userId,
      boardId: updatedBoard.id
    });

    return {
      message: 'Board updated successfully',
      board: updatedBoard,
    };
  }

  @ApiOperation({ summary: 'Видалити дошку' })
  @Delete(':id')
  async deleteBoard(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    const board = await this.boardService.findByIdAndOwner(id, user.userId);
    const isDeleted = await this.boardService.delete(id, user.userId);

    if (!isDeleted || !board) {
      throw new NotFoundException('Board not found or you do not have permission to delete it');
    }
    
    await this.activityService.logActivity({
      type: 'board_deleted',
      description: `Deleted board "${board.title}"`,
      userId: user.userId,
      boardId: id
    });

    return {
      message: 'Board deleted successfully',
    };
  }
}
