import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Your frontend URLs
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true, // If you're using cookies or authentication
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Backend running on: http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();