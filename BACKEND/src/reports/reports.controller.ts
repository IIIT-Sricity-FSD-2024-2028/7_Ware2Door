import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@ApiTags('Reports')
@ApiSecurity('x-role')
@Controller()
export class ReportsController {
    constructor(public reportsService: ReportsService) {}

    @ApiOperation({ summary: 'Get inbound shipments report for a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Get('/hub/:hubId/inbound')
    getInboundForHub(@Param('hubId') hubId: string) {
        return this.reportsService.getInboundForHub(hubId);
    }

    @ApiOperation({ summary: 'Get outbound shipments report for a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Get('/hub/:hubId/outbound')
    getOutboundForHub(@Param('hubId') hubId: string) {
        return this.reportsService.getOutboundForHub(hubId);
    }

    @ApiOperation({ summary: 'Get inbound shipments for a local agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/inbound')
    getAgencyInbound(@Param('agencyId') agencyId: string) {
        return this.reportsService.getAgencyInbound(agencyId);
    }

    @ApiOperation({ summary: 'Get outbound shipments from a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/:warehouseId/outbound')
    getOutboundShipments(@Param('warehouseId') id: string) {
        return this.reportsService.getOutboundShipments(id);
    }

    @ApiOperation({ summary: 'Get pre-alert shipment report for a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/:warehouseId/preAlert')
    getPreAlertReport(@Param('warehouseId') id: string) {
        return this.reportsService.getPreAlertReport(id);
    }
}

