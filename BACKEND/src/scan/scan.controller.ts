import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { ScanService } from './scan.service';
import { ScanDto } from './dto/scan.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@ApiTags('Scan')
@ApiSecurity('x-role')
@Controller()
export class ScanController {
    constructor(public scanService: ScanService) {}

    @ApiOperation({ summary: 'In-scan a shipment at a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Post('/hub/:hubId/inscan')
    inscanAtHub(@Body() body: ScanDto, @Param('hubId') hubId: string) {
        return this.scanService.inscanAtHub(hubId, body.trackingId);
    }

    @ApiOperation({ summary: 'Out-scan a shipment from a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Post('/hub/:hubId/outscan')
    outscanFromHub(@Body() body: ScanDto, @Param('hubId') hubId: string) {
        return this.scanService.outscanFromHub(hubId, body.trackingId);
    }

    @ApiOperation({ summary: 'Get scan history for a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Get('/hub/:hubId/scanHistory')
    getScanHistory(@Param('hubId') hubId: string) {
        return this.scanService.getScanHistory(hubId);
    }

    @ApiOperation({ summary: 'In-scan a shipment at a local agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/inscan')
    agencyInscan(@Body() body: ScanDto, @Param('agencyId') agencyId: string) {
        return this.scanService.agencyInscan(agencyId, body.trackingId);
    }

    @ApiOperation({ summary: 'Out-scan a shipment from a local agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/outscan')
    agencyOutscan(@Body() body: ScanDto, @Param('agencyId') agencyId: string) {
        return this.scanService.agencyOutscan(agencyId, body.trackingId);
    }

    @ApiOperation({ summary: 'Get scan history for a local agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/scanHistory')
    getAgencyScanHistory(@Param('agencyId') agencyId: string) {
        return this.scanService.getAgencyScanHistory(agencyId);
    }
}

