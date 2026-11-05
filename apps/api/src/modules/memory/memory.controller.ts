import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { principal } from '../../platform/http/request';
import { MemoryService } from './memory.service';

@Controller('api/v1/me/memory')
export class MemoryController {
    constructor(private readonly memory: MemoryService) { }
    @Get('personal')
    async personal(@Req() req: Request) {
        return this.memory.personal(principal(req).id);
    }
    @Get('camps')
    async camps(@Req() req: Request) {
        return { camps: await this.memory.camps(principal(req).id) };
    }
    @Get()
    async list(@Req() req: Request) {
        return { milestones: await this.memory.list(principal(req).id) };
    }
}
