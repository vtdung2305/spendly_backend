import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  console.log('0');
  app.use(helmet());
  app.enableCors({
    origin: config.get<string[]>('cors.allowedOrigins'),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
    maxAge: 86400,
  });

  console.log('1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  console.log('2');
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Spendly API')
    .setDescription('Personal finance app backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  console.log('before swagger');

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  console.log('after createDocument');

  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('port') ?? 3000;

  console.log('after setup');

  console.log('PORT =', port);

  await app.listen(port, '0.0.0.0');

  console.log('listen ok');
}
bootstrap();
