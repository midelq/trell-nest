import { Injectable, Inject } from '@nestjs/common';
import { DATABASE } from '../database/database.module.js';
import type { DrizzleDB } from '../database/database.module.js';
import { cards } from '../database/schema.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

@Injectable()
export class CardService {
  constructor(@Inject(DATABASE) private db: DrizzleDB) {}

  async findByListId(listId: number) {
    return this.db
      .select({
        id: cards.id,
        title: cards.title,
        description: cards.description,
        position: cards.position,
        listId: cards.listId,
        createdAt: cards.createdAt,
        updatedAt: cards.updatedAt,
      })
      .from(cards)
      .where(eq(cards.listId, listId))
      .orderBy(cards.position);
  }

  async findById(cardId: number) {
    const result = await this.db
      .select({
        id: cards.id,
        title: cards.title,
        description: cards.description,
        position: cards.position,
        listId: cards.listId,
        createdAt: cards.createdAt,
        updatedAt: cards.updatedAt,
      })
      .from(cards)
      .where(eq(cards.id, cardId))
      .limit(1);

    return result[0] || null;
  }

  async create(data: { title: string; description?: string; listId: number; position?: number }) {
    return this.db.transaction(async (tx) => {
      let position = data.position;

      // If position not provided, get the next position
      if (position === undefined) {
        const existingCards = await tx
          .select({ position: cards.position })
          .from(cards)
          .where(eq(cards.listId, data.listId))
          .orderBy(cards.position);

        position = existingCards.length > 0 ? Math.max(...existingCards.map((c) => c.position)) + 1 : 0;
      } else {
        // If position is provided, shift all cards at or after this position
        await tx
          .update(cards)
          .set({
            position: sql`${cards.position} + 1`,
            updatedAt: new Date(),
          })
          .where(and(eq(cards.listId, data.listId), gte(cards.position, position)));
      }

      const [newCard] = await tx
        .insert(cards)
        .values({
          title: data.title,
          description: data.description,
          listId: data.listId,
          position: position,
        })
        .returning({
          id: cards.id,
          title: cards.title,
          description: cards.description,
          position: cards.position,
          listId: cards.listId,
          createdAt: cards.createdAt,
          updatedAt: cards.updatedAt,
        });

      return newCard;
    });
  }

  async update(cardId: number, data: { title?: string; description?: string | null; listId?: number; position?: number }) {
    return this.db.transaction(async (tx) => {
      // Get existing card
      const [existingCard] = await tx.select().from(cards).where(eq(cards.id, cardId)).limit(1);

      if (!existingCard) return null;

      // Check if moving to a different list
      if (data.listId && data.listId !== existingCard.listId) {
        // Remove card from old list (shift positions)
        await tx
          .update(cards)
          .set({
            position: sql`${cards.position} - 1`,
            updatedAt: new Date(),
          })
          .where(and(eq(cards.listId, existingCard.listId), gte(cards.position, existingCard.position + 1)));

        // Add card to new list at specified position or at the end
        let newPosition = data.position;
        if (newPosition === undefined) {
          const existingCards = await tx
            .select({ position: cards.position })
            .from(cards)
            .where(eq(cards.listId, data.listId))
            .orderBy(cards.position);

          newPosition = existingCards.length > 0 ? Math.max(...existingCards.map((c) => c.position)) + 1 : 0;
        } else {
          // Shift cards in new list to make room
          await tx
            .update(cards)
            .set({
              position: sql`${cards.position} + 1`,
              updatedAt: new Date(),
            })
            .where(and(eq(cards.listId, data.listId), gte(cards.position, newPosition)));
        }

        data.position = newPosition; // Ensure we use the calculated position
      }
      // If changing position within the same list
      else if (data.position !== undefined && (!data.listId || data.listId === existingCard.listId)) {
        const oldPosition = existingCard.position;
        const newPosition = data.position;

        if (oldPosition !== newPosition) {
          if (newPosition > oldPosition) {
            await tx
              .update(cards)
              .set({
                position: sql`${cards.position} - 1`,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(cards.listId, existingCard.listId),
                  gte(cards.position, oldPosition + 1),
                  lte(cards.position, newPosition),
                ),
              );
          } else if (newPosition < oldPosition) {
            await tx
              .update(cards)
              .set({
                position: sql`${cards.position} + 1`,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(cards.listId, existingCard.listId),
                  gte(cards.position, newPosition),
                  lte(cards.position, oldPosition - 1),
                ),
              );
          }
        }
      }

      const [updatedCard] = await tx
        .update(cards)
        .set({
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.position !== undefined && { position: data.position }),
          ...(data.listId !== undefined && { listId: data.listId }),
          updatedAt: new Date(),
        })
        .where(eq(cards.id, cardId))
        .returning({
          id: cards.id,
          title: cards.title,
          description: cards.description,
          position: cards.position,
          listId: cards.listId,
          createdAt: cards.createdAt,
          updatedAt: cards.updatedAt,
        });

      return updatedCard;
    });
  }

  async delete(cardId: number): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [existingCard] = await tx.select().from(cards).where(eq(cards.id, cardId)).limit(1);

      if (!existingCard) return false;

      const deletedPosition = existingCard.position;
      const listId = existingCard.listId;

      await tx.delete(cards).where(eq(cards.id, cardId));

      await tx
        .update(cards)
        .set({
          position: sql`${cards.position} - 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(cards.listId, listId), gte(cards.position, deletedPosition + 1)));

      return true;
    });
  }
}
