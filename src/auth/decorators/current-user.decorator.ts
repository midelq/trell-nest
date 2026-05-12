import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../strategies/jwt.strategy.js';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    // Дістаємо об'єкт request з контексту
    const request = ctx.switchToHttp().getRequest();
    
    // passport-jwt автоматично кладе результат validate() у request.user
    return request.user;
  },
);
