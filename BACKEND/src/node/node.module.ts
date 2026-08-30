import { Module } from '@nestjs/common';
import { NodeController } from './node.controller';
import { NodeService } from './node.service';
import { NodeRepository } from './node.repository';
import { AuthModule } from '../auth/auth.module';
import { AdminTeamsModule } from '../admin-teams/admin-teams.module';

@Module({
    imports: [AuthModule, AdminTeamsModule],
    controllers: [NodeController],
    providers: [NodeService, NodeRepository],
})
export class NodeModule {}

