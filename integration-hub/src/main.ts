import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from 'src/app.module';
import { getEnv } from 'src/config/env';

async function bootstrap() {
  const env = getEnv();
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix(env.INTEGRATION_HUB_API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(env.PORT);

  Logger.log(
    `Integration Hub listening on http://localhost:${env.PORT}/${env.INTEGRATION_HUB_API_PREFIX}`,
    'Bootstrap',
  );
}

bootstrap();
