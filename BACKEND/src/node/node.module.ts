import { Module } from '@nestjs/common';
import { NodeController } from './node.controller';
import { NodeService } from './node.service';
import { NodeRepository } from './node.repository';

@Module({
  controllers: [NodeController],
  providers: [NodeService,NodeRepository]
})
export class NodeModule {}
