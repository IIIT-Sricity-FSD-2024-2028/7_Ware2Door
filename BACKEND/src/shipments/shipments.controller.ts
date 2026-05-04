import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { DispatchShipmentDto } from './dto/dispatch-shipment.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@ApiTags('Shipments')
@ApiSecurity('x-role')
@Controller('shipment')
export class ShipmentsController {
    constructor(private readonly shipmentsService: ShipmentsService) {}

    @ApiOperation({ summary: 'Get manifest/pending shipments for a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/:warehouseId/manifest')
    getManifest(@Param('warehouseId') id: string) {
        return this.shipmentsService.getManifestForWarehouse(id);
    }

    @ApiOperation({ summary: 'Get all shipments in the system' })
    @Roles(Role.WAREHOUSE)
    @Get('/all')
    getAllShipments() {
        return this.shipmentsService.shipmentrepo.getAllShipments();
    }

    @ApiOperation({ summary: 'Dispatch a shipment from a warehouse to a hub and agency' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Post('/:warehouseId/dispatch')
    dispatchShipment(@Param('warehouseId') id: string, @Body() body: DispatchShipmentDto) {
        return this.shipmentsService.dispatchShipment(id, body.orderId, body.hubId, body.agencyId);
    }

    @ApiOperation({ summary: 'Get shipment summary for a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/summary/:warehouseId')
    getSummary(@Param('warehouseId') id: string) {
        return this.shipmentsService.getSummary(id);
    }
}

