import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

const parseCorsOrigins = (): Array<string | RegExp> | boolean => {
  if (process.env.NODE_ENV === 'production') {
    const configuredOrigins = process.env.FRONTEND_URL?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (!configuredOrigins || configuredOrigins.length === 0) {
      throw new Error('FRONTEND_URL must be configured in production');
    }

    return configuredOrigins;
  }

  return [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Restaurant Management System API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);

  console.log(`Backend running on port ${port}`);
}

bootstrap();
