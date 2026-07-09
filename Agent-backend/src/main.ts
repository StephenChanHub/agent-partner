import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false,
  });

  const rawOrigins =
    process.env.CORS_ORIGINS ??
    process.env.CORS_ORIGIN ??
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  });

  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);

  const prefix = process.env.API_PREFIX ?? 'api';
  console.log(`Jarvis Core API listening on http://${host}:${port}/${prefix}`);
  if (process.env.PUBLIC_API_URL) {
    console.log(`Public API URL: ${process.env.PUBLIC_API_URL.replace(/\/$/, '')}/${prefix}`);
  }
}

bootstrap();
