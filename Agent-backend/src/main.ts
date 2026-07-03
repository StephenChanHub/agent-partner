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
  const allowPrivateNetworkOrigins = process.env.CORS_ALLOW_PRIVATE_NETWORKS !== 'false';
  const privateNetworkOriginPatterns = [
    /^https?:\/\/localhost(?::\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(?::\d+)?$/,
    /^https?:\/\/10(?:\.\d{1,3}){3}(?::\d+)?$/,
    /^https?:\/\/192\.168(?:\.\d{1,3}){2}(?::\d+)?$/,
    /^https?:\/\/172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}(?::\d+)?$/,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (allowPrivateNetworkOrigins && privateNetworkOriginPatterns.some((pattern) => pattern.test(origin))) {
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
  console.log(`Jarvis Core sandbox API is running on http://${host}:${port}/${prefix}`);
  console.log(`For Mac host + UTM Ubuntu, use http://192.168.64.2:${port}/${prefix} if that is the VM IP.`);
}

bootstrap();
