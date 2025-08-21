import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Configurar prefijo global para las rutas
  app.setGlobalPrefix('api-beca');

  // Habilitar CORS
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configurar ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Becas')
    .setDescription('API para gestionar usuarios y estudiantes')
    .setVersion('1.0')
    .addTag('Usuarios')
    .addTag('Estudiantes')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Configurar el puerto
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Aplicación corriendo en http://localhost:${port}/api-beca`);
  logger.log(`Documentación Swagger disponible en http://localhost:${port}/api-docs`);
}

bootstrap().catch((error) => {
  console.error('Error iniciando la aplicación:', error);
  process.exit(1);
});