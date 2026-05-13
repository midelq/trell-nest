import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, UsePipes, NotFoundException } from '@nestjs/common';
import { ListService } from './list.service.js';
import { ActivityService } from '../activity/activity.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { CreateListDto, UpdateListDto, createListSchema, updateListSchema } from './dto/list.dto.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lists')
export class ListController {
  constructor(
    private readonly listService: ListService,
    private readonly activityService: ActivityService,
  ) {}

  @ApiOperation({ summary: 'Отримати всі списки для певної дошки' })
  @Get('board/:boardId')
  async getListsByBoard(@Param('boardId', ParseIntPipe) boardId: number) {
    const lists = await this.listService.findByBoardId(boardId);
    return {
      lists,
      count: lists.length,
    };
  }

  @ApiOperation({ summary: 'Отримати список за ID' })
  @Get(':id')
  async getListById(@Param('id', ParseIntPipe) id: number) {
    const list = await this.listService.findById(id);
    
    if (!list) {
      throw new NotFoundException('List not found');
    }
    
    return { list };
  }

  @ApiOperation({ summary: 'Створити новий список' })
  @Post()
  @UsePipes(new ZodValidationPipe(createListSchema))
  async createList(@Body() body: CreateListDto, @CurrentUser() user: JwtPayload) {
    const newList = await this.listService.create(body);
    
    await this.activityService.logActivity({
      type: 'list_created',
      description: `Created list "${newList.title}"`,
      userId: user.userId,
      boardId: newList.boardId,
      listId: newList.id
    });
    
    return {
      message: 'List created successfully',
      list: newList,
    };
  }

  @ApiOperation({ summary: 'Оновити список (назву або позицію)' })
  @Put(':id')
  @UsePipes(new ZodValidationPipe(updateListSchema))
  async updateList(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateListDto,
    @CurrentUser() user: JwtPayload
  ) {
    const updatedList = await this.listService.update(id, body);
    
    if (!updatedList) {
      throw new NotFoundException('List not found');
    }
    
    await this.activityService.logActivity({
      type: 'list_updated',
      description: `Updated list "${updatedList.title}"`,
      userId: user.userId,
      boardId: updatedList.boardId,
      listId: updatedList.id
    });
    
    return {
      message: 'List updated successfully',
      list: updatedList,
    };
  }

  @ApiOperation({ summary: 'Видалити список' })
  @Delete(':id')
  async deleteList(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    const list = await this.listService.findById(id);
    const isDeleted = await this.listService.delete(id);
    
    if (!isDeleted || !list) {
      throw new NotFoundException('List not found');
    }
    
    await this.activityService.logActivity({
      type: 'list_deleted',
      description: `Deleted list "${list.title}"`,
      userId: user.userId,
      boardId: list.boardId,
      listId: list.id
    });
    
    return {
      message: 'List deleted successfully',
    };
  }
}
