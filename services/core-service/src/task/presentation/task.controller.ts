import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { parse, uuid } from '../../shared/http/validation';
import { AppError } from '../../shared/error/app-error';
import { TaskService } from '../application/task.service';

const title = z.string().min(2).max(280);
const minutes = z.number().int().min(1).max(10);
const update = z.object({ title: title.nullish(), minutes: minutes.nullish(), status: z.enum(['ready', 'done', 'deferred']).nullish() })
  .refine(value => value.title != null || value.minutes != null || value.status != null);
const create = z.object({ title, minutes, sourceBrainDumpId: uuid.nullish() });
const list = z.object({ status: z.string().optional(), limit: z.preprocess(value => value === undefined || value === '' ? 50 : value,
  z.coerce.number().int().min(1).max(100)) });

@Controller('api/v1')
export class TaskController {
  constructor(private readonly tasks: TaskService) {}
  @Post('next-actions')
  create(@Req() request: Request, @Body() body: unknown) {
    return this.tasks.create(request.session.user!.id, parse(create, body));
  }
  @Get('tasks')
  list(@Req() request: Request, @Query() query: unknown) {
    const input = parse(list, query);
    const status = z.enum(['ready', 'done', 'deferred', 'archived']).optional().safeParse(input.status);
    if (!status.success) throw new AppError('INVALID_TASK', 'Task status is invalid', 400);
    return this.tasks.list(request.session.user!.id, status.data, input.limit);
  }
  @Get('tasks/:taskId')
  get(@Req() request: Request, @Param('taskId') id: string) {
    return this.tasks.get(request.session.user!.id, parse(uuid, id));
  }
  @Patch('tasks/:taskId')
  update(@Req() request: Request, @Param('taskId') id: string, @Body() body: unknown) {
    return this.tasks.update(request.session.user!.id, parse(uuid, id), parse(update, body));
  }
  @Post('tasks/:taskId/archive')
  @HttpCode(200)
  archive(@Req() request: Request, @Param('taskId') id: string) {
    return this.tasks.archive(request.session.user!.id, parse(uuid, id));
  }
}
