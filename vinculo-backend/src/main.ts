import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('VÍNCULO API — Seguros Bolívar')
    .setDescription(
      'OpenX Developer Portal API: Open Insurance + Open Finance + Open Data',
    )
    .setVersion('3.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Autenticación y tokens OAuth 2.0')
    .addTag('Onboarding', 'Registro de aliados y Golden Path')
    .addTag('Apps', 'Gestión de aplicaciones y credenciales')
    .addTag('Insurance', 'APIs de Open Insurance (cotización, emisión, siniestros)')
    .addTag('Sandbox', 'Mock engine interactivo')
    .addTag('Analytics', 'Métricas y consumo de APIs')
    .addTag('Catalog', 'Catálogo de APIs OpenX')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🟢 VÍNCULO API running on http://localhost:${port}`);
  console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
