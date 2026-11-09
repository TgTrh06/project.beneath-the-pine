import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { FocusService } from '../application/focus.service';
@Injectable()
export class FocusMaintenance implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  constructor(private readonly focus: FocusService) {}
  onModuleInit() { this.timer = setInterval(() => void this.focus.finalizeExpired().catch(() => undefined), 30000); this.timer.unref(); }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
}
