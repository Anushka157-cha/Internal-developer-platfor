import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost',
      'https://frontend-eight-lilac-25.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 IDP Backend running on http://localhost:${port}`);
}

bootstrap();
