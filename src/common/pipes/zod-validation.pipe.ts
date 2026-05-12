import { PipeTransform, ArgumentMetadata, BadRequestException, Injectable } from '@nestjs/common';
import { ZodError } from 'zod';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    try {
      // Парсимо тіло запиту через передану Zod схему
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        // Якщо помилка валідації — форматуємо гарно і кидаємо 400 Bad Request
        const zodErr = error as any;
        const formattedErrors = zodErr.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          details: formattedErrors,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
