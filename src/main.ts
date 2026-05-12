import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Підключаємо cookie-parser як Middleware
  app.use(cookieParser());
  
  // Налаштування Swagger (документація API)
  const config = new DocumentBuilder()
    .setTitle('Trello Clone API')
    .setDescription('NestJS API для Trello клону')
    .setVersion('1.0')
    .addBearerAuth() // Дозволяє вводити JWT токен в Swagger
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Документація буде доступна за адресою /api/docs
  
  // Вмикаємо CORS (як в Express)
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true, // Щоб пропускати куки
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
