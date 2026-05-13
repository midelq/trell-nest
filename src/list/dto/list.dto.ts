import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Схеми Zod (такі самі як в Express)
export const createListSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  boardId: z.number().int().positive('Board ID must be a positive integer'),
  position: z.number().int().min(0).optional()
});

export const updateListSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').optional(),
  position: z.number().int().min(0).optional()
}).refine(data => data.title !== undefined || data.position !== undefined, {
  message: 'At least one field (title or position) must be provided'
});

// Класи DTO для Swagger
export class CreateListDto implements z.infer<typeof createListSchema> {
  @ApiProperty({ example: 'To Do', description: 'Назва списку' })
  title!: string;

  @ApiProperty({ example: 1, description: 'ID дошки' })
  boardId!: number;

  @ApiPropertyOptional({ example: 0, description: 'Позиція списку (необов\'язково)' })
  position?: number;
}

export class UpdateListDto implements z.infer<typeof updateListSchema> {
  @ApiPropertyOptional({ example: 'In Progress', description: 'Нова назва списку' })
  title?: string;

  @ApiPropertyOptional({ example: 1, description: 'Нова позиція списку' })
  position?: number;
}
