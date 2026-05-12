import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

// Zod schemas
export const createBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters')
});

export const updateBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters')
});

// DTO Classes
export class CreateBoardDto implements z.infer<typeof createBoardSchema> {
  @ApiProperty({ example: 'My Awesome Board', description: 'Назва дошки' })
  title!: string;
}

export class UpdateBoardDto implements z.infer<typeof updateBoardSchema> {
  @ApiProperty({ example: 'New Board Name', description: 'Нова назва дошки' })
  title!: string;
}
