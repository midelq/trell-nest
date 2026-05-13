import { Module } from '@nestjs/common';
import { CardController } from './card.controller.js';
import { CardService } from './card.service.js';
import { ListModule } from '../list/list.module.js';

@Module({
  imports: [ListModule],
  controllers: [CardController],
  providers: [CardService]
})
export class CardModule {}
