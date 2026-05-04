import { Controller, Post, Body, Get, Param, Delete, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { NodeService } from './node.service';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { Role } from '../auth/roles.enum';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { StockAdditionDto } from './dto/stock-addition.dto';
import { CreatePendingShipmentDto } from './dto/create-pending-shipment.dto';
import { RecordAttemptDto } from './dto/record-attempt.dto';

@ApiTags('Auth & Node')
@Controller()
export class NodeController {

    constructor(public nodeservice: NodeService) {}

    @Public()
    @ApiOperation({ summary: 'Verify email — trigger OTP (public)' })
    @Post('/auth/verify-email')
    verifyEmail(@Body() body: VerifyEmailDto) {
        return this.nodeservice.verifyEmail(body.email);
    }

    @Public()
    @ApiOperation({ summary: 'Reset password using OTP (public)' })
    @Post('/auth/reset-password')
    resetPassword(@Body() body: ResetPasswordDto) {
        if (body.otp !== '000000') {
            return { success: false, error: 'Invalid OTP. Please enter a valid 6-digit OTP.' };
        }
        return this.nodeservice.resetPassword(body.email, body.newPassword);
    }

    @Public()
    @ApiOperation({ summary: 'Warehouse login (public)' })
    @Post('/auth/warehouse')
    GetCredentials1(@Body() body: LoginDto) { return this.nodeservice.ValidateCredentials(body.email, body.password, 'WAREHOUSE'); }

    @Public()
    @ApiOperation({ summary: 'Super User login (public)' })
    @Post('/auth/superuser')
    GetCredentialsSU(@Body() body: LoginDto) { return this.nodeservice.ValidateCredentials(body.email, body.password, 'SUPERUSER'); }

    @Public()
    @ApiOperation({ summary: 'Transit Hub login (public)' })
    @Post('/auth/transit')
    GetCredentials2(@Body() body: LoginDto) { return this.nodeservice.ValidateCredentials(body.email, body.password, 'TRANSIT_HUB'); }

    @Public()
    @ApiOperation({ summary: 'Local Agency login (public)' })
    @Post('/auth/agency')
    GetCredential3(@Body() body: LoginDto) { return this.nodeservice.ValidateCredentials(body.email, body.password, 'LOCAL_AGENCY'); }

    @Public()
    @ApiOperation({ summary: 'Update node profile (public)' })
    @ApiParam({ name: 'id', description: 'Node ID' })
    @Post('/auth/profile/:id')
    updateProfile(@Body() body: UpdateProfileDto, @Param('id') id: string) { return this.nodeservice.noderepo.updateProfile(id, body.name || '', body.email || '', body.phone || ''); }

    @Public()
    @ApiOperation({ summary: 'Update node password (public)' })
    @ApiParam({ name: 'id', description: 'Node ID' })
    @Post('/auth/password/:id')
    updatePassword(@Body() body: UpdatePasswordDto, @Param('id') id: string) { return this.nodeservice.noderepo.updatePassword(id, body.currentPassword, body.newPassword); }

    @Public()
    @ApiOperation({ summary: 'Get all transit hubs (public)' })
    @Get('/system/hubs')
    getHubs() { return this.nodeservice.noderepo.getHubs(); }

    @Public()
    @ApiOperation({ summary: 'Get all local agencies (public)' })
    @Get('/system/agencies')
    getAgencies() { return this.nodeservice.noderepo.getAgencies(); }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get current stock inventory for a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/:warehouseId/stockInventory')
    getCurentStock(@Param('warehouseId') id: string) { return this.nodeservice.getCurrentStock(id); }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Add a stock item to warehouse inventory' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Post('/:warehouseId/stockAddition')
    addStockItem(@Body() body: StockAdditionDto, @Param('warehouseId') id: string) { return this.nodeservice.addItem(body.labelID || '', body.itemName, body.quantity, id); }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get pending shipments for a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/:warehouseId/pendingShipments')
    getPendingShipments(@Param('warehouseId') id: string) { return this.nodeservice.getPendingShipments(id); }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Add a pending shipment to a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Post('/:warehouseId/pendingShipments')
    addPendingShipment(@Body() body: CreatePendingShipmentDto, @Param('warehouseId') id: string) { return this.nodeservice.addPendingShipment(id, body); }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Delete a pending shipment from a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @ApiParam({ name: 'orderId', description: 'Order ID to delete' })
    @Roles(Role.WAREHOUSE)
    @Delete('/:warehouseId/pendingShipments/:orderId')
    deletePendingShipment(@Param('warehouseId') id: string, @Param('orderId') orderId: string) { return this.nodeservice.deletePendingShipment(id, orderId); }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get inventory at a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Get('/hub/:hubId/inventory')
    getHubInventory(@Param('hubId') hubId: string) { return this.nodeservice.getHubInventory(hubId); }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get capacity information for a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Get('/hub/:hubId/capacity')
    getHubCapacity(@Param('hubId') hubId: string) { return this.nodeservice.getHubCapacity(hubId); }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get shipments assigned to an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/shipments')
    getAgencyShipments(@Param('agencyId') agencyId: string) { return this.nodeservice.getAgencyShipments(agencyId); }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get deliveries for an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/deliveries')
    getAgencyDeliveries(@Param('agencyId') agencyId: string) { return this.nodeservice.getAgencyDeliveries(agencyId); }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Record a failed delivery attempt' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @ApiParam({ name: 'trackingId', description: 'Shipment tracking ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/deliveries/:trackingId/attempt')
    recordAttempt(@Body() body: RecordAttemptDto, @Param('agencyId') agencyId: string, @Param('trackingId') trackingId: string) { return this.nodeservice.recordDeliveryAttempt(agencyId, trackingId, body.failStatus, body.notes || ''); }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Mark a shipment as delivered' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @ApiParam({ name: 'trackingId', description: 'Shipment tracking ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/deliveries/:trackingId/deliver')
    markDelivered(@Param('agencyId') agencyId: string, @Param('trackingId') trackingId: string) { return this.nodeservice.markDelivered(agencyId, trackingId); }
}
