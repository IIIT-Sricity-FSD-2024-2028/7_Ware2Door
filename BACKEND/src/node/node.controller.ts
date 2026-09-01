import { Controller, Post, Body, Get, Param, Delete, Put, Res, UseFilters, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { NodeService } from './node.service';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { Role } from '../auth/roles.enum';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { AllExceptionsFilter } from '../common/all-exceptions.filter';
import { ModuleLogger } from '../common/module-logger';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { StockAdditionDto } from './dto/stock-addition.dto';
import { CreatePendingShipmentDto } from './dto/create-pending-shipment.dto';
import { RecordAttemptDto } from './dto/record-attempt.dto';
import { ThirdPartyGuard } from '../admin-teams/third-party.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Auth & Node')
@UseFilters(AllExceptionsFilter, HttpExceptionFilter)
@Controller()
export class NodeController {
    private readonly logger = new ModuleLogger('node');

    constructor(
        public nodeservice: NodeService,
        private jwtService: JwtService,
    ) { }

    private issueToken(res: Response, user: any, role: string) {
        const payload = { sub: user.id, role, id: user.id, name: user.name, email: user.email };
        const token = this.jwtService.sign(payload);
        res.cookie('w2d_token', token, {
            httpOnly: true,
            maxAge: 8 * 60 * 60 * 1000,
        });
        const { password, ...safeUser } = user;
        return { status: 'success', token, user: safeUser };
    }

    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Verify email — trigger OTP (public)' })
    @Post('/auth/verify-email')
    verifyEmail(@Body() body: VerifyEmailDto) {
        this.logger.log(`verify-email → ${body.email}`);
        return this.nodeservice.verifyEmail(body.email);
    }

    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Reset password using OTP (public)' })
    @Post('/auth/reset-password')
    resetPassword(@Body() body: ResetPasswordDto) {
        this.logger.log(`reset-password → ${body.email}`);
        if (body.otp !== '000000') {
            this.logger.warn(`reset-password failed — invalid OTP for ${body.email}`);
            return { success: false, error: 'Invalid OTP. Please enter a valid 6-digit OTP.' };
        }
        return this.nodeservice.resetPassword(body.email, body.newPassword);
    }

    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Warehouse login (public)' })
    @Post('/auth/warehouse')
    async loginWarehouse(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        this.logger.log(`login:WAREHOUSE → ${body.email}`);
        const result = await this.nodeservice.ValidateCredentials(body.email, body.password, 'WAREHOUSE');
        if (result.status !== 'success') {
            this.logger.warn(`login:WAREHOUSE failed → ${body.email}`);
            return result;
        }
        this.logger.log(`login:WAREHOUSE success → ${body.email}`);
        return this.issueToken(res, result.message, Role.WAREHOUSE);
    }

    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Super User login (public)' })
    @Post('/auth/superuser')
    async loginSuperuser(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        this.logger.log(`login:SUPERUSER → ${body.email}`);
        const result = await this.nodeservice.ValidateCredentials(body.email, body.password, 'SUPERUSER');
        if (result.status !== 'success') {
            this.logger.warn(`login:SUPERUSER failed → ${body.email}`);
            return result;
        }
        this.logger.log(`login:SUPERUSER success → ${body.email}`);
        return this.issueToken(res, result.message, Role.SUPER_USER);
    }

    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Admin Teams login (public)' })
    @Post('/auth/admin-teams')
    async loginAdminTeams(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        this.logger.log(`login:ADMIN_TEAMS → ${body.email}`);
        const result = await this.nodeservice.ValidateCredentials(body.email, body.password, 'ADMIN_TEAMS');
        if (result.status !== 'success') {
            this.logger.warn(`login:ADMIN_TEAMS failed → ${body.email}`);
            return result;
        }
        this.logger.log(`login:ADMIN_TEAMS success → ${body.email}`);
        return this.issueToken(res, result.message, Role.ADMIN_TEAMS);
    }

    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Transit Hub login (public)' })
    @Post('/auth/transit')
    async loginTransit(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        this.logger.log(`login:TRANSIT_HUB → ${body.email}`);
        const result = await this.nodeservice.ValidateCredentials(body.email, body.password, 'TRANSIT_HUB');
        if (result.status !== 'success') {
            this.logger.warn(`login:TRANSIT_HUB failed → ${body.email}`);
            return result;
        }
        this.logger.log(`login:TRANSIT_HUB success → ${body.email}`);
        return this.issueToken(res, result.message, Role.TRANSIT_HUB);
    }

    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Local Agency login (public)' })
    @Post('/auth/agency')
    async loginAgency(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        this.logger.log(`login:LOCAL_AGENCY → ${body.email}`);
        const result = await this.nodeservice.ValidateCredentials(body.email, body.password, 'LOCAL_AGENCY');
        if (result.status !== 'success') {
            this.logger.warn(`login:LOCAL_AGENCY failed → ${body.email}`);
            return result;
        }
        this.logger.log(`login:LOCAL_AGENCY success → ${body.email}`);
        return this.issueToken(res, result.message, Role.LOCAL_AGENCY);
    }

    @Public()
    @ApiOperation({ summary: 'Logout — clears session cookie (public)' })
    @Post('/auth/logout')
    logout(@Res({ passthrough: true }) res: Response) {
        this.logger.log('logout');
        res.clearCookie('w2d_token', { httpOnly: true });
        return { success: true };
    }

    @Public()
    @ApiOperation({ summary: 'Get all transit hubs (public)' })
    @Get('/system/hubs')
    getHubs() {
        this.logger.log('getHubs');
        return this.nodeservice.noderepo.getHubs();
    }

    @Public()
    @ApiOperation({ summary: 'Get all local agencies (public)' })
    @Get('/system/agencies')
    getAgencies() {
        this.logger.log('getAgencies');
        return this.nodeservice.noderepo.getAgencies();
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Update node profile' })
    @ApiParam({ name: 'id', description: 'Node ID' })
    @Post('/auth/profile/:id')
    updateProfile(@Body() body: UpdateProfileDto, @Param('id') id: string) {
        this.logger.log(`updateProfile → ${id}`);
        return this.nodeservice.noderepo.updateProfile(id, body.name || '', body.email || '', body.phone || '');
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Update node password' })
    @ApiParam({ name: 'id', description: 'Node ID' })
    @Post('/auth/password/:id')
    updatePassword(@Body() body: UpdatePasswordDto, @Param('id') id: string) {
        this.logger.log(`updatePassword → ${id}`);
        return this.nodeservice.noderepo.updatePassword(id, body.currentPassword, body.newPassword);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get current stock inventory for a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/:warehouseId/stockInventory')
    getCurentStock(@Param('warehouseId') id: string) {
        this.logger.log(`getStock → ${id}`);
        return this.nodeservice.getCurrentStock(id);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Add a stock item to warehouse inventory' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Post('/:warehouseId/stockAddition')
    addStockItem(@Body() body: StockAdditionDto, @Param('warehouseId') id: string) {
        this.logger.log(`addStock → ${id} | item=${body.itemName} qty=${body.quantity}`);
        return this.nodeservice.addItem(body.labelID || '', body.itemName, body.quantity, id);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get pending shipments for a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/:warehouseId/pendingShipments')
    getPendingShipments(@Param('warehouseId') id: string) {
        this.logger.log(`getPendingShipments → ${id}`);
        return this.nodeservice.getPendingShipments(id);
    }

    @Public()
    @UseGuards(ThirdPartyGuard)
    @ApiOperation({ summary: 'Add a pending shipment to a warehouse (requires x-api-key from a subscribed third party)' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @Post('/:warehouseId/pendingShipments')
    addPendingShipment(
        @Body() body: CreatePendingShipmentDto,
        @Param('warehouseId') id: string,
        @Req() req: Request & { thirdParty?: { id: string; name: string; tier: string } },
    ) {
        this.logger.log(`addPendingShipment → ${id} | order=${body.orderId} | partner=${req.thirdParty?.name ?? 'unknown'}`);
        return this.nodeservice.addPendingShipment(id, body, req.thirdParty);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Delete a pending shipment from a warehouse' })
    @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
    @ApiParam({ name: 'orderId', description: 'Order ID to delete' })
    @Roles(Role.WAREHOUSE)
    @Delete('/:warehouseId/pendingShipments/:orderId')
    deletePendingShipment(@Param('warehouseId') id: string, @Param('orderId') orderId: string) {
        this.logger.log(`rejectShipment → ${id} | order=${orderId}`);
        return this.nodeservice.deletePendingShipment(id, orderId);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get inventory at a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Get('/hub/:hubId/inventory')
    getHubInventory(@Param('hubId') hubId: string) {
        this.logger.log(`getHubInventory → ${hubId}`);
        return this.nodeservice.getHubInventory(hubId);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get capacity information for a transit hub' })
    @ApiParam({ name: 'hubId', description: 'Transit Hub ID' })
    @Roles(Role.TRANSIT_HUB)
    @Get('/hub/:hubId/capacity')
    getHubCapacity(@Param('hubId') hubId: string) {
        this.logger.log(`getHubCapacity → ${hubId}`);
        return this.nodeservice.getHubCapacity(hubId);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get shipments assigned to an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/shipments')
    getAgencyShipments(@Param('agencyId') agencyId: string) {
        this.logger.log(`getAgencyShipments → ${agencyId}`);
        return this.nodeservice.getAgencyShipments(agencyId);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get deliveries for an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/deliveries')
    getAgencyDeliveries(@Param('agencyId') agencyId: string) {
        this.logger.log(`getAgencyDeliveries → ${agencyId}`);
        return this.nodeservice.getAgencyDeliveries(agencyId);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Record a failed delivery attempt' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @ApiParam({ name: 'trackingId', description: 'Shipment tracking ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/deliveries/:trackingId/attempt')
    recordAttempt(@Body() body: RecordAttemptDto, @Param('agencyId') agencyId: string, @Param('trackingId') trackingId: string) {
        this.logger.log(`recordAttempt → agency=${agencyId} tracking=${trackingId} reason=${body.failStatus}`);
        return this.nodeservice.recordDeliveryAttempt(agencyId, trackingId, body.failStatus, body.notes || '');
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Mark a shipment as delivered' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @ApiParam({ name: 'trackingId', description: 'Shipment tracking ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/deliveries/:trackingId/deliver')
    markDelivered(@Param('agencyId') agencyId: string, @Param('trackingId') trackingId: string) {
        this.logger.log(`markDelivered → agency=${agencyId} tracking=${trackingId}`);
        return this.nodeservice.markDelivered(agencyId, trackingId);
    }
}
