import { Module } from '@nestjs/common';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { WorkersRepository } from './workers.repository';

@Module({
  controllers: [WorkersController],
  providers: [WorkersService, WorkersRepository]
})
export class WorkersModule {}
