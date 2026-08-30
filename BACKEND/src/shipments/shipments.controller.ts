import { Controller, Get, Param, Post, Body, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { DispatchShipmentDto } from './dto/dispatch-shipment.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { AllExceptionsFilter } from '../common/all-exceptions.filter';
import { ModuleLogger } from '../common/module-logger';

@ApiTags('Shipments')
@ApiSecurity('x-role')
@UseFilters(AllExceptionsFilter, HttpExceptionFilter)
@Controller()
export class ShipmentsController {
    private readonly logger = new ModuleLogger('shipments');

    constructor(private readonly shipmentsService: ShipmentsService) {}

    @ApiOperation({ summary: 'Get manifest/pending shipments for a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/:warehouseId/manifest')
    getManifest(@Param('warehouseId') id: string) {
        this.logger.log(`getManifest → warehouse=${id}`);
        return this.shipmentsService.getManifestForWarehouse(id);
    }

    @ApiOperation({ summary: 'Get all shipments in the system' })
    @Roles(Role.WAREHOUSE)
    @Get('/all')
    getAllShipments() {
        this.logger.log('getAllShipments');
        return this.shipmentsService.shipmentrepo.getAllShipments();
    }

    @ApiOperation({ summary: 'Dispatch a shipment from a warehouse to a hub and agency' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Post('/:warehouseId/dispatch')
    async dispatchShipment(@Param('warehouseId') id: string, @Body() body: DispatchShipmentDto) {
        this.logger.log(`dispatch → warehouse=${id} order=${body.orderId} hub=${body.hubId} agency=${body.agencyId}`);
        const result = await this.shipmentsService.dispatchShipment(id, body.orderId, body.hubId, body.agencyId);
        if (!result.success) this.logger.warn(`dispatch failed → warehouse=${id} order=${body.orderId} | ${result.error}`);
        return result;
    }

    @ApiOperation({ summary: 'Get shipment summary for a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/summary/:warehouseId')
    getSummary(@Param('warehouseId') id: string) {
        this.logger.log(`getSummary → warehouse=${id}`);
        return this.shipmentsService.getSummary(id);
    }
}

