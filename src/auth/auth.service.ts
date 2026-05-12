import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { DATABASE } from '../database/database.module.js';
import type { DrizzleDB } from '../database/database.module.js';
import { users, refreshTokens } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE) private db: DrizzleDB,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private getRefreshTokenExpiryDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);
    return date;
  }

  async register(dto: RegisterDto) {
    // 1. Check if user exists
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException('Email already exists');
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Create user
    const [newUser] = await this.db
      .insert(users)
      .values({
        fullName: dto.fullName,
        email: dto.email,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        createdAt: users.createdAt,
      });

    // 4. Generate tokens
    return this.generateAuthResponse(newUser.id, newUser.email, newUser.fullName);
  }

  async login(dto: LoginDto) {
    // 1. Find user
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Generate tokens
    return this.generateAuthResponse(user.id, user.email, user.fullName);
  }

  async logout(userId: number, refreshToken?: string) {
    if (refreshToken) {
      await this.db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
    }
    return { success: true };
  }

  async refresh(token: string) {
    const [storedToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token))
      .limit(1);

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Find user
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, storedToken.userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Delete old refresh token
    await this.db.delete(refreshTokens).where(eq(refreshTokens.token, token));

    return this.generateAuthResponse(user.id, user.email, user.fullName);
  }

  private async generateAuthResponse(userId: number, email: string, fullName: string) {
    // Generate Access Token
    const accessToken = this.jwtService.sign({ userId, email, fullName });

    // Generate Refresh Token
    const refreshToken = this.generateRefreshToken();

    // Store Refresh Token in DB
    await this.db.insert(refreshTokens).values({
      token: refreshToken,
      userId,
      expiresAt: this.getRefreshTokenExpiryDate(),
    });

    return {
      user: { id: userId, email, fullName },
      accessToken,
      refreshToken, // Controller will put this in a cookie
    };
  }
}
