import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            error: 'Internal Server Error',
            message: exception instanceof Error ? exception.message : 'Unknown error',
          };

    // Якщо це наша помилка валідації (Zod), вона вже має правильний формат
    // Якщо це інша помилка NestJS, форматуємо її під старий Express-формат
    const formattedResponse = typeof errorResponse === 'object' && errorResponse !== null
      ? {
          ...errorResponse,
          path: request.url,
          timestamp: new Date().toISOString(),
        }
      : {
          error: HttpStatus[status],
          message: errorResponse,
          path: request.url,
          timestamp: new Date().toISOString(),
        };

    response.status(status).json(formattedResponse);
  }
}
