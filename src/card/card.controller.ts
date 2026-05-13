import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, UsePipes, NotFoundException } from '@nestjs/common';
import { CardService } from './card.service.js';
import { CreateCardDto, UpdateCardDto, createCardSchema, updateCardSchema } from './dto/card.dto.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

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
  async createCard(@Body() body: CreateCardDto) {
    const newCard = await this.cardService.create(body);
    
    // TODO: Додати логування активності (Phase 6)
    
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
  ) {
    const updatedCard = await this.cardService.update(id, body);
    
    if (!updatedCard) {
      throw new NotFoundException('Card not found');
    }
    
    // TODO: Додати логування активності (Phase 6)
    
    return {
      message: 'Card updated successfully',
      card: updatedCard,
    };
  }

  @ApiOperation({ summary: 'Видалити картку' })
  @Delete(':id')
  async deleteCard(@Param('id', ParseIntPipe) id: number) {
    // TODO: Додати логування активності (Phase 6)
    
    const isDeleted = await this.cardService.delete(id);
    
    if (!isDeleted) {
      throw new NotFoundException('Card not found');
    }
    
    return {
      message: 'Card deleted successfully',
    };
  }
}
