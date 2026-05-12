import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Цей клас просто обгортає стандартний AuthGuard для стратегії 'jwt'.
  // Тепер ми можемо використовувати @UseGuards(JwtAuthGuard) над нашими роутами!
}
