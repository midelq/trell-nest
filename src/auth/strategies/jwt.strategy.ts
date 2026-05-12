import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Цей payload зашитий у ваш JWT токен (те що ми передали в jwtService.sign)
export interface JwtPayload {
  userId: number;
  email: string;
  fullName: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Кажемо Passport шукати токен у заголовку Authorization як Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Відхиляти токени, що протерміновані
      secretOrKey: configService.getOrThrow('JWT_SECRET'), // Ваш секретний ключ
    });
  }

  // Цей метод автоматично викликається, коли токен успішно розшифрований.
  // Те, що ми тут повертаємо, NestJS покладе в `req.user`.
  // Тобто це повна заміна вашому req.user = decoded у старому authMiddleware!
  async validate(payload: JwtPayload) {
    return { userId: payload.userId, email: payload.email, fullName: payload.fullName };
  }
}
