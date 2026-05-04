import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';
import { ShipmentsRepository } from './shipments.repository';
import { NodeRepository } from '../node/node.repository';

@Module({
    controllers: [ShipmentsController],
    providers: [ShipmentsService, ShipmentsRepository, NodeRepository],
    exports: [ShipmentsService, ShipmentsRepository]
})
export class ShipmentsModule {}
