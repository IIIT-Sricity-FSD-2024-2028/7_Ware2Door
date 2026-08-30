import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { AllExceptionsFilter } from '../common/all-exceptions.filter';
import { ModuleLogger } from '../common/module-logger';

@ApiTags('Reports')
@ApiSecurity('x-role')
@UseFilters(AllExceptionsFilter, HttpExceptionFilter)
@Controller()
export class ReportsController {
    private readonly logger = new ModuleLogger('reports');

    constructor(public reportsService: ReportsService) {}

    @ApiOperation({ summary: 'Get inbound shipments report for a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Get('/hub/:hubId/inbound')
    getInboundForHub(@Param('hubId') hubId: string) {
        this.logger.log(`getInbound → hub=${hubId}`);
        return this.reportsService.getInboundForHub(hubId);
    }

    @ApiOperation({ summary: 'Get outbound shipments report for a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Get('/hub/:hubId/outbound')
    getOutboundForHub(@Param('hubId') hubId: string) {
        this.logger.log(`getOutbound → hub=${hubId}`);
        return this.reportsService.getOutboundForHub(hubId);
    }

    @ApiOperation({ summary: 'Get inbound shipments for a local agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/inbound')
    getAgencyInbound(@Param('agencyId') agencyId: string) {
        this.logger.log(`getAgencyInbound → agency=${agencyId}`);
        return this.reportsService.getAgencyInbound(agencyId);
    }

    @ApiOperation({ summary: 'Get outbound shipments from a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/:warehouseId/outbound')
    getOutboundShipments(@Param('warehouseId') id: string) {
        this.logger.log(`getOutbound → warehouse=${id}`);
        return this.reportsService.getOutboundShipments(id);
    }

    @ApiOperation({ summary: 'Get pre-alert shipment report for a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/:warehouseId/preAlert')
    getPreAlertReport(@Param('warehouseId') id: string) {
        this.logger.log(`getPreAlert → warehouse=${id}`);
        return this.reportsService.getPreAlertReport(id);
    }
}
