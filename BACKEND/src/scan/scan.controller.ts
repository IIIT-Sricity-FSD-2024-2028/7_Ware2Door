import { Controller, Post, Body, Get, Param, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { ScanService } from './scan.service';
import { ScanDto } from './dto/scan.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { AllExceptionsFilter } from '../common/all-exceptions.filter';
import { ModuleLogger } from '../common/module-logger';

@ApiTags('Scan')
@ApiSecurity('x-role')
@UseFilters(AllExceptionsFilter, HttpExceptionFilter)
@Controller()
export class ScanController {
    private readonly logger = new ModuleLogger('scan');

    constructor(public scanService: ScanService) {}

    @ApiOperation({ summary: 'In-scan a shipment at a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Post('/hub/:hubId/inscan')
    async inscanAtHub(@Body() body: ScanDto, @Param('hubId') hubId: string) {
        this.logger.log(`inscan → hub=${hubId} tracking=${body.trackingId}`);
        const result = await this.scanService.inscanAtHub(hubId, body.trackingId);
        if (result.status === 'error') this.logger.warn(`inscan flagged → hub=${hubId} tracking=${body.trackingId} | ${'flagMsg' in result ? result.flagMsg : ''}`);
        return result;
    }

    @ApiOperation({ summary: 'Out-scan a shipment from a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Post('/hub/:hubId/outscan')
    async outscanFromHub(@Body() body: ScanDto, @Param('hubId') hubId: string) {
        this.logger.log(`outscan → hub=${hubId} tracking=${body.trackingId}`);
        const result = await this.scanService.outscanFromHub(hubId, body.trackingId);
        if (result.status === 'error') this.logger.warn(`outscan flagged → hub=${hubId} tracking=${body.trackingId} | ${'flagMsg' in result ? result.flagMsg : ''}`);
        return result;
    }

    @ApiOperation({ summary: 'Get scan history for a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Get('/hub/:hubId/scanHistory')
    getScanHistory(@Param('hubId') hubId: string) {
        this.logger.log(`getScanHistory → hub=${hubId}`);
        return this.scanService.getScanHistory(hubId);
    }

    @ApiOperation({ summary: 'In-scan a shipment at a local agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/inscan')
    async agencyInscan(@Body() body: ScanDto, @Param('agencyId') agencyId: string) {
        this.logger.log(`agency-inscan → agency=${agencyId} tracking=${body.trackingId}`);
        const result = await this.scanService.agencyInscan(agencyId, body.trackingId);
        if (result.status === 'error') this.logger.warn(`agency-inscan flagged → agency=${agencyId} tracking=${body.trackingId} | ${'flagMsg' in result ? result.flagMsg : ''}`);
        return result;
    }

    @ApiOperation({ summary: 'Out-scan a shipment from a local agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/outscan')
    async agencyOutscan(@Body() body: ScanDto, @Param('agencyId') agencyId: string) {
        this.logger.log(`agency-outscan → agency=${agencyId} tracking=${body.trackingId}`);
        const result = await this.scanService.agencyOutscan(agencyId, body.trackingId);
        if (result.status === 'error') this.logger.warn(`agency-outscan flagged → agency=${agencyId} tracking=${body.trackingId} | ${'flagMsg' in result ? result.flagMsg : ''}`);
        return result;
    }

    @ApiOperation({ summary: 'Get scan history for a local agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/scanHistory')
    getAgencyScanHistory(@Param('agencyId') agencyId: string) {
        this.logger.log(`getAgencyScanHistory → agency=${agencyId}`);
        return this.scanService.getAgencyScanHistory(agencyId);
    }
}
