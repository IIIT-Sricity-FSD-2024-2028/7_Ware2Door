import { Module } from '@nestjs/common';
import { SuperUserController } from './superuser.controller';
import { SuperUserService } from './superuser.service';
import { SuperUserRepository } from './superuser.repository';

@Module({
    controllers: [SuperUserController],
    providers: [SuperUserService, SuperUserRepository],
})
export class SuperUserModule {}
