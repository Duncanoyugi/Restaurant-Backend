import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORS (safe for production)
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? true
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // ✅ Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✅ Swagger ONLY in development
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

  // ✅ REQUIRED for Render
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Backend running on port ${port}`);
}

bootstrap();
