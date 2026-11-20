import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();
const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(env));
configureApp(app, env);
await app.listen(env.PORT, '0.0.0.0');
