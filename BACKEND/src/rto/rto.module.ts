import { Module } from '@nestjs/common';
import { RtoController } from './rto.controller';
import { RtoService } from './rto.service';
import { RtoRepository } from './rto.repository';

@Module({
    controllers: [RtoController],
    providers: [RtoService, RtoRepository],
    exports: [RtoService],
})
export class RtoModule {}
