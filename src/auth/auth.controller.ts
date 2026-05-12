import { Controller, Post, Body, Req, Res, UsePipes, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto, registerSchema, loginSchema } from './dto/auth.dto.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth') // Для Swagger (групує ендпоінти)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Опції для cookie
  private getRefreshTokenCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 днів
      path: '/',
    };
  }

  @ApiOperation({ summary: 'Реєстрація нового користувача' })
  @ApiResponse({ status: 201, description: 'Користувач успішно зареєстрований' })
  @ApiResponse({ status: 400, description: 'Помилка валідації' })
  @ApiResponse({ status: 409, description: 'Email вже існує' })
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema)) // 👈 Наш пайп!
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(body);
    
    res.cookie('refreshToken', result.refreshToken, this.getRefreshTokenCookieOptions());
    
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @ApiOperation({ summary: 'Логін користувача' })
  @HttpCode(200)
  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body);
    
    res.cookie('refreshToken', result.refreshToken, this.getRefreshTokenCookieOptions());
    
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @ApiOperation({ summary: 'Оновити токени' })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      // Якщо немає куки з токеном, ми просто повертаємо 401
      res.status(401).json({ message: 'Refresh token missing' });
      return;
    }

    const result = await this.authService.refresh(refreshToken);
    res.cookie('refreshToken', result.refreshToken, this.getRefreshTokenCookieOptions());
    
    return {
      accessToken: result.accessToken,
    };
  }

  @ApiOperation({ summary: 'Вийти з системи (видалити токен)' })
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    
    // Очищаємо куку
    res.clearCookie('refreshToken');
    
    // Якщо токен був, видаляємо його з БД (але нам потрібен userId або просто токен)
    if (refreshToken) {
      await this.authService.logout(0, refreshToken); // 0 як заглушка, бо видаляємо по токену
    }
    
    return { message: 'Logged out successfully' };
  }
}
