import { Injectable, Inject } from '@nestjs/common';
import { DATABASE } from '../database/database.module.js';
import type { DrizzleDB } from '../database/database.module.js';
import { activities } from '../database/schema.js';
import { eq } from 'drizzle-orm';

export type ActivityType =
  | 'board_created'
  | 'board_updated'
  | 'board_deleted'
  | 'list_created'
  | 'list_updated'
  | 'list_deleted'
  | 'card_created'
  | 'card_moved'
  | 'card_updated'
  | 'card_deleted';

@Injectable()
export class ActivityService {
  constructor(@Inject(DATABASE) private db: DrizzleDB) {}

  async logActivity(params: {
    type: ActivityType;
    description: string;
    userId: number;
    boardId: number;
    listId?: number;
    cardId?: number;
  }) {
    await this.db.insert(activities).values(params);
  }

  async getActivitiesByBoard(boardId: number, limit = 50) {
    return this.db
      .select()
      .from(activities)
      .where(eq(activities.boardId, boardId))
      .orderBy(activities.createdAt)
      .limit(limit);
  }
}
