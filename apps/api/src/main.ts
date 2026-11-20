import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();
// bufferLogs segura os logs de boot até o logger pino assumir (tudo sai em JSON).
const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(env), {
  bufferLogs: true,
});
app.useLogger(app.get(Logger));
configureApp(app, env);
await app.listen(env.PORT, '0.0.0.0');
