import { Module } from '@nestjs/common';
import { TaskRepository } from './application/task.repository';
import { TaskService } from './application/task.service';
import { PgTaskRepository } from './infrastructure/pg-task.repository';
import { TaskController } from './presentation/task.controller';

@Module({
  controllers: [TaskController],
  providers: [
    { provide: TaskRepository, useClass: PgTaskRepository },
    { provide: TaskService, useFactory: (tasks: TaskRepository) => new TaskService(tasks), inject: [TaskRepository] },
  ],
})
export class TaskModule {}
