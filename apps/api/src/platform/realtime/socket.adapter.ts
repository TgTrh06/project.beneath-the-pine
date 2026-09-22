import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplicationContext } from '@nestjs/common';
import type { ApiConfig } from '../config/api-config';
export class PineSocketAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly config: ApiConfig
  ) {
    super(app);
  }

  createIOServer(port: number, options?: Record<string, unknown>) {
    return super.createIOServer(port, {
      ...options,
      cors: {
        origin: this.config.API_WEB_ORIGIN,
        credentials: true,
        methods: ['GET', 'POST']
      }
    });
  }
}
