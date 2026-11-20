import { Module, type DynamicModule } from '@nestjs/common';
import { APP_ENV, type AppEnv } from './config/env.js';

@Module({})
export class AppModule {
  static forRoot(env: AppEnv): DynamicModule {
    return {
      module: AppModule,
      providers: [{ provide: APP_ENV, useValue: env }],
    };
  }
}
