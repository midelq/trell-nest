import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, UsePipes, NotFoundException } from '@nestjs/common';
import { CardService } from './card.service.js';
import { ActivityService } from '../activity/activity.service.js';
import { ListService } from '../list/list.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { CreateCardDto, UpdateCardDto, createCardSchema, updateCardSchema } from './dto/card.dto.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardController {
  constructor(
    private readonly cardService: CardService,
    private readonly activityService: ActivityService,
    private readonly listService: ListService,
  ) {}

  @ApiOperation({ summary: 'Отримати всі картки для певного списку' })
  @Get('list/:listId')
  async getCardsByList(@Param('listId', ParseIntPipe) listId: number) {
    const cards = await this.cardService.findByListId(listId);
    return {
      cards,
      count: cards.length,
    };
  }

  @ApiOperation({ summary: 'Отримати картку за ID' })
  @Get(':id')
  async getCardById(@Param('id', ParseIntPipe) id: number) {
    const card = await this.cardService.findById(id);
    
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    
    return { card };
  }

  @ApiOperation({ summary: 'Створити нову картку' })
  @Post()
  @UsePipes(new ZodValidationPipe(createCardSchema))
  async createCard(@Body() body: CreateCardDto, @CurrentUser() user: JwtPayload) {
    const newCard = await this.cardService.create(body);
    
    const list = await this.listService.findById(body.listId);
    if (list) {
      await this.activityService.logActivity({
        type: 'card_created',
        description: `Created card "${newCard.title}"`,
        userId: user.userId,
        boardId: list.boardId,
        listId: list.id,
        cardId: newCard.id
      });
    }
    
    return {
      message: 'Card created successfully',
      card: newCard,
    };
  }

  @ApiOperation({ summary: 'Оновити картку (назву, опис, позицію, або перемістити в інший список)' })
  @Put(':id')
  @UsePipes(new ZodValidationPipe(updateCardSchema))
  async updateCard(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCardDto,
    @CurrentUser() user: JwtPayload
  ) {
    const updatedCard = await this.cardService.update(id, body);
    
    if (!updatedCard) {
      throw new NotFoundException('Card not found');
    }
    
    const list = await this.listService.findById(updatedCard.listId);
    if (list) {
      let type: any = 'card_updated';
      let description = `Updated card "${updatedCard.title}"`;

      if (body.listId) {
        type = 'card_moved';
        description = `Moved card "${updatedCard.title}" to list "${list.title}"`;
      }

      await this.activityService.logActivity({
        type,
        description,
        userId: user.userId,
        boardId: list.boardId,
        listId: list.id,
        cardId: updatedCard.id
      });
    }
    
    return {
      message: 'Card updated successfully',
      card: updatedCard,
    };
  }

  @ApiOperation({ summary: 'Видалити картку' })
  @Delete(':id')
  async deleteCard(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    const card = await this.cardService.findById(id);
    const isDeleted = await this.cardService.delete(id);
    
    if (!isDeleted || !card) {
      throw new NotFoundException('Card not found');
    }
    
    const list = await this.listService.findById(card.listId);
    if (list) {
      await this.activityService.logActivity({
        type: 'card_deleted',
        description: `Deleted card "${card.title}"`,
        userId: user.userId,
        boardId: list.boardId,
        listId: list.id,
        cardId: card.id
      });
    }
    
    return {
      message: 'Card deleted successfully',
    };
  }
}
