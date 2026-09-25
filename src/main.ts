import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression({ threshold: 0 }));
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EvacuApp API')
    .setDescription('API para gestion de emergencias, zonas seguras e incidentes.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // 👈 SE AGREGA '0.0.0.0' PARA ESCUCHAR EN TODAS LAS INTERFACES DE RED DE LA PC
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();