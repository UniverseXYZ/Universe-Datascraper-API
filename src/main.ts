import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import session from 'express-session';
import R from 'ramda';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get<ConfigService>(ConfigService);
  const port = config.get('PORT') || 8080;
  const sessionSecret = config.get('session_secret');
  app.setGlobalPrefix('v1', {
    exclude: [''],
  });

  // Middlewares
  app.use(helmet());

  // Swagger Documentation
  const options = new DocumentBuilder()
    .setTitle('Universe API')
    .setDescription('Universe API Documentation')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('v1/doc', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  if (R.isNil(sessionSecret)) {
    throw new Error('No session secret');
  }

  const sessionOptions = {
    secret: <string>sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  };

  if (config.get('app_env') === 'production') {
    sessionOptions.cookie.secure = true;
  }

  app.use(session(sessionOptions));

  await app.listen(port);
}
bootstrap();
