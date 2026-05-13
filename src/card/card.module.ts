import { Module } from '@nestjs/common';
import { CardController } from './card.controller.js';
import { CardService } from './card.service.js';

@Module({
  controllers: [CardController],
  providers: [CardService]
})
export class CardModule {}
