import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AdminTeamsController } from './admin-teams.controller';
import { AdminTeamsService } from './admin-teams.service';
import { AdminTeamsRepository } from './admin-teams.repository';
import { AuthModule } from '../auth/auth.module';
import { ThirdPartyGuard } from './third-party.guard';

@Module({
    imports: [
        AuthModule,
        MulterModule.register({ dest: './uploads/legal-docs' }),
    ],
    controllers: [AdminTeamsController],
    providers: [AdminTeamsService, AdminTeamsRepository, ThirdPartyGuard],
    exports: [AdminTeamsService, ThirdPartyGuard],
})
export class AdminTeamsModule {}
