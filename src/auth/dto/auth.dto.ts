import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

// 1. Zod Схеми (такі самі як в Express)
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100)
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100)
});

// 2. Класи DTO для Swagger та NestJS
// Ми використовуємо implements, щоб TypeScript перевіряв, що клас збігається з Zod-схемою

export class RegisterDto implements z.infer<typeof registerSchema> {
  @ApiProperty({ example: 'John Doe', description: 'Повне ім\'я користувача' })
  fullName!: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email користувача' })
  email!: string;

  @ApiProperty({ example: 'secret123', description: 'Пароль (мінімум 6 символів)' })
  password!: string;
}

export class LoginDto implements z.infer<typeof loginSchema> {
  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiProperty({ example: 'secret123' })
  password!: string;
}

export class ChangePasswordDto implements z.infer<typeof changePasswordSchema> {
  @ApiProperty({ example: 'oldSecret123' })
  currentPassword!: string;

  @ApiProperty({ example: 'newSecret123' })
  newPassword!: string;
}
