import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const createCardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  listId: z.number().int().positive('List ID must be a positive integer'),
  position: z.number().int().min(0).optional()
});

export const updateCardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  description: z.string().max(2000, 'Description must be less than 2000 characters').nullable().optional(),
  position: z.number().int().min(0).optional(),
  listId: z.number().int().positive('List ID must be a positive integer').optional()
}).refine(data => data.title !== undefined || data.description !== undefined || data.position !== undefined || data.listId !== undefined, {
  message: 'At least one field (title, description, position, or listId) must be provided'
});

export class CreateCardDto implements z.infer<typeof createCardSchema> {
  @ApiProperty({ example: 'Implement login', description: 'Назва картки' })
  title!: string;

  @ApiPropertyOptional({ example: 'Need to use JWT for this', description: 'Опис' })
  description?: string;

  @ApiProperty({ example: 1, description: 'ID списку' })
  listId!: number;

  @ApiPropertyOptional({ example: 0, description: 'Позиція' })
  position?: number;
}

export class UpdateCardDto implements z.infer<typeof updateCardSchema> {
  @ApiPropertyOptional({ example: 'Implement login properly', description: 'Нова назва' })
  title?: string;

  @ApiPropertyOptional({ example: 'Added refresh tokens', description: 'Новий опис' })
  description?: string | null;

  @ApiPropertyOptional({ example: 2, description: 'Новий ID списку (якщо перенесли)' })
  listId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Нова позиція' })
  position?: number;
}
