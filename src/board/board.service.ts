import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE } from '../database/database.module.js';
import type { DrizzleDB } from '../database/database.module.js';
import { boards } from '../database/schema.js';
import { eq, and, asc } from 'drizzle-orm';

@Injectable()
export class BoardService {
  constructor(@Inject(DATABASE) private db: DrizzleDB) {}

  async findAllByOwner(ownerId: number) {
    return this.db
      .select({
        id: boards.id,
        title: boards.title,
        ownerId: boards.ownerId,
        createdAt: boards.createdAt,
        updatedAt: boards.updatedAt,
      })
      .from(boards)
      .where(eq(boards.ownerId, ownerId));
  }

  async findByIdAndOwner(boardId: number, ownerId: number) {
    const result = await this.db
      .select({
        id: boards.id,
        title: boards.title,
        ownerId: boards.ownerId,
        createdAt: boards.createdAt,
        updatedAt: boards.updatedAt,
      })
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.ownerId, ownerId)))
      .limit(1);

    return result[0] || null;
  }

  async findFullByIdAndOwner(boardId: number, ownerId: number) {
    const result = await this.db.query.boards.findFirst({
      where: and(eq(boards.id, boardId), eq(boards.ownerId, ownerId)),
      with: {
        lists: {
          orderBy: (lists, { asc }) => [asc(lists.position)],
          with: {
            cards: {
              orderBy: (cards, { asc }) => [asc(cards.position)],
            },
          },
        },
      },
    });

    return result || null;
  }

  async create(title: string, ownerId: number) {
    const [board] = await this.db
      .insert(boards)
      .values({ title, ownerId })
      .returning({
        id: boards.id,
        title: boards.title,
        ownerId: boards.ownerId,
        createdAt: boards.createdAt,
        updatedAt: boards.updatedAt,
      });

    return board;
  }

  async update(boardId: number, ownerId: number, title: string) {
    const existingBoard = await this.findByIdAndOwner(boardId, ownerId);

    if (!existingBoard) {
      return null;
    }

    const [updatedBoard] = await this.db
      .update(boards)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(eq(boards.id, boardId))
      .returning({
        id: boards.id,
        title: boards.title,
        ownerId: boards.ownerId,
        createdAt: boards.createdAt,
        updatedAt: boards.updatedAt,
      });

    return updatedBoard;
  }

  async delete(boardId: number, ownerId: number): Promise<boolean> {
    const existingBoard = await this.findByIdAndOwner(boardId, ownerId);

    if (!existingBoard) {
      return false;
    }

    await this.db.delete(boards).where(eq(boards.id, boardId));

    return true;
  }
}
