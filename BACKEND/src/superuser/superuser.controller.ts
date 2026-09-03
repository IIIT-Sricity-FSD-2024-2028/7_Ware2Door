import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { SuperuserService } from './superuser.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@ApiTags('Super User')
@ApiSecurity('x-role')
@Controller('superuser')
@Roles(Role.SUPER_USER)
export class SuperuserController {
    constructor(private readonly superuserService: SuperuserService) {}

    @Get('nodes')
    @ApiOperation({ summary: 'Get all nodes with minimal info (Super User only)' })
    async getNodes() {
        return this.superuserService.getNodes();
    }

    @Get('escalations')
    @ApiOperation({ summary: 'Get all escalations with status (Super User only)' })
    async getEscalations() {
        return this.superuserService.getEscalations();
    }

    @Get('third-parties')
    @ApiOperation({ summary: 'Get third party API usage info (Super User only)' })
    async getThirdParties() {
        return this.superuserService.getThirdParties();
    }

    @Get('node-performance')
    @ApiOperation({ summary: 'Get live node performance analytics (Super User only)' })
    async getNodePerformance() {
        return this.superuserService.getNodePerformance();
    }
}
