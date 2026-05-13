import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, UsePipes, NotFoundException } from '@nestjs/common';
import { ListService } from './list.service.js';
import { CreateListDto, UpdateListDto, createListSchema, updateListSchema } from './dto/list.dto.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lists')
export class ListController {
  constructor(private readonly listService: ListService) {}

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
  async createList(@Body() body: CreateListDto) {
    const newList = await this.listService.create(body);
    
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
  ) {
    const updatedList = await this.listService.update(id, body);
    
    if (!updatedList) {
      throw new NotFoundException('List not found');
    }
    
    return {
      message: 'List updated successfully',
      list: updatedList,
    };
  }

  @ApiOperation({ summary: 'Видалити список' })
  @Delete(':id')
  async deleteList(@Param('id', ParseIntPipe) id: number) {
    const isDeleted = await this.listService.delete(id);
    
    if (!isDeleted) {
      throw new NotFoundException('List not found');
    }
    
    return {
      message: 'List deleted successfully',
    };
  }
}
