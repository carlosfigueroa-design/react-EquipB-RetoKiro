import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger / OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('VÍNCULO Developer Portal API')
    .setDescription(
      'API backend del portal de desarrolladores VÍNCULO de Seguros Bolívar. ' +
        'Ecosistema OpenX: Open Finance + Open Insurance + Open Data.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT RS256 token',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticación Email + OTP + JWT RS256')
    .addTag('apis', 'CRUD y versionamiento de APIs')
    .addTag('sandbox', 'Motor de ejecución mock interactivo')
    .addTag('ai', 'Generación de documentación y asistente IA')
    .addTag('search', 'Búsqueda full-text y semántica')
    .addTag('observability', 'Métricas, alertas y trazabilidad')
    .addTag('governance', 'Ciclo de vida de APIs')
    .addTag('audit', 'Log de auditoría inmutable')
    .addTag('users', 'Gestión de usuarios y RBAC')
    .addTag('notifications', 'Notificaciones email + in-app')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🔗 VÍNCULO Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
