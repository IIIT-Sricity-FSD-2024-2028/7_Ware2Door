import { Module } from '@nestjs/common';
import { TrackController } from './track.controller';
import { TrackService } from './track.service';
import { ShipmentsModule } from '../shipments/shipments.module';
import { NodeRepository } from '../node/node.repository';
import { RtoModule } from '../rto/rto.module';

@Module({
    imports: [ShipmentsModule, RtoModule],
    controllers: [TrackController],
    providers: [TrackService, NodeRepository],
})
export class TrackModule {}

