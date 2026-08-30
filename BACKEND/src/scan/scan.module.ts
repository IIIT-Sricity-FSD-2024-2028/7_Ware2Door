import { Module } from '@nestjs/common';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { ScanRepository } from './scan.repository';
import { RtoModule } from '../rto/rto.module';

@Module({
  imports: [RtoModule],
  controllers: [ScanController],
  providers: [ScanService, ScanRepository]
})
export class ScanModule {}

