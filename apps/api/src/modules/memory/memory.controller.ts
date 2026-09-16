import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { principal } from '../../platform/http/request';
import { MemoryService } from './memory.service';
@Controller('api/v1/me/memory')
export class MemoryController { constructor(private readonly memory: MemoryService) {} @Get() async list(@Req() req: Request) { return { milestones: await this.memory.list(principal(req).id) }; } }
