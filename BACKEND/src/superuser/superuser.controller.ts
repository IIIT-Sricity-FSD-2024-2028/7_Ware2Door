import { Controller, Get, Post, Put, Delete, Param, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam, ApiBody } from '@nestjs/swagger';
import { SuperUserService } from './superuser.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import {
    CreateAdminDto,
    UpdateAdminDto,
    SetAdminStatusDto,
    SetConfigDto,
    AppendLogDto,
} from './dto';

@ApiTags('Super User')
@ApiSecurity('x-role')
@Controller('su')
@Roles(Role.SUPER_USER)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class SuperUserController {
    constructor(private readonly svc: SuperUserService) {}

    @ApiOperation({ summary: 'Get system overview (counts, stats)' })
    @Get('overview')
    getOverview() { return this.svc.getOverview(); }

    @ApiOperation({ summary: 'Get all admin nodes' })
    @Get('admins')
    getAdmins() { return this.svc.getAllAdmins(); }

    @ApiOperation({ summary: 'Create a new admin node' })
    @Post('admins')
    createAdmin(@Body() body: CreateAdminDto) { return this.svc.createAdmin(body); }

    @ApiOperation({ summary: 'Update an admin node' })
    @ApiParam({ name: 'id', description: 'Admin ID' })
    @Put('admins/:id')
    updateAdmin(@Param('id') id: string, @Body() body: UpdateAdminDto) { return this.svc.updateAdmin(id, body); }

    @ApiOperation({ summary: 'Delete an admin node' })
    @ApiParam({ name: 'id', description: 'Admin ID' })
    @Delete('admins/:id')
    deleteAdmin(@Param('id') id: string) { return this.svc.deleteAdmin(id); }

    @ApiOperation({ summary: 'Set active/inactive status for an admin' })
    @ApiParam({ name: 'id', description: 'Admin ID' })
    @Put('admins/:id/status')
    setStatus(@Param('id') id: string, @Body() body: SetAdminStatusDto) {
        return this.svc.setAdminStatus(id, body.active);
    }

    @ApiOperation({ summary: 'Get all warehouses' })
    @Get('warehouses')
    getWarehouses() { return this.svc.getWarehouses(); }

    @ApiOperation({ summary: 'Get drilldown details for a warehouse' })
    @ApiParam({ name: 'id', description: 'Warehouse ID' })
    @Get('warehouses/:id')
    getWarehouseDrilldown(@Param('id') id: string) { return this.svc.getWarehouseDrilldown(id); }

    @ApiOperation({ summary: 'Cancel all pending shipments for a warehouse (bypass)' })
    @ApiParam({ name: 'id', description: 'Warehouse ID' })
    @Delete('warehouses/:id/pending')
    cancelAllPending(@Param('id') id: string) { return this.svc.cancelAllPending(id); }

    @ApiOperation({ summary: 'Cancel a specific pending shipment for a warehouse' })
    @ApiParam({ name: 'id', description: 'Warehouse ID' })
    @ApiParam({ name: 'orderId', description: 'Order ID to cancel' })
    @Delete('warehouses/:id/pending/:orderId')
    cancelSinglePending(@Param('id') id: string, @Param('orderId') orderId: string) {
        return this.svc.cancelSinglePending(id, orderId);
    }

    @ApiOperation({ summary: 'Get all transit hubs' })
    @Get('hubs')
    getHubs() { return this.svc.getHubs(); }

    @ApiOperation({ summary: 'Get drilldown details for a transit hub' })
    @ApiParam({ name: 'id', description: 'Hub ID' })
    @Get('hubs/:id')
    getHubDrilldown(@Param('id') id: string) { return this.svc.getHubDrilldown(id); }

    @ApiOperation({ summary: 'Force out-scan all shipments from a transit hub (bypass)' })
    @ApiParam({ name: 'id', description: 'Hub ID' })
    @Put('hubs/:id/outscan-all')
    outscanAllHubShipments(@Param('id') id: string) { return this.svc.outscanAllHubShipments(id); }

    @ApiOperation({ summary: 'Get all local agencies' })
    @Get('agencies')
    getAgencies() { return this.svc.getAgencies(); }

    @ApiOperation({ summary: 'Get drilldown details for an agency' })
    @ApiParam({ name: 'id', description: 'Agency ID' })
    @Get('agencies/:id')
    getAgencyDrilldown(@Param('id') id: string) { return this.svc.getAgencyDrilldown(id); }

    @ApiOperation({ summary: 'Update the status of an agent within an agency' })
    @ApiParam({ name: 'id', description: 'Agency ID' })
    @ApiParam({ name: 'agentId', description: 'Agent ID' })
    @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string', example: 'Active', enum: ['Active', 'Busy', 'Offline'] } } } })
    @Put('agencies/:id/agents/:agentId/status')
    updateAgentStatus(@Param('id') id: string, @Param('agentId') agentId: string, @Body('status') status: string) {
        return this.svc.updateAgentStatus(id, agentId, status);
    }

    @ApiOperation({ summary: 'Get all shipments' })
    @Get('shipments')
    getShipments() { return this.svc.getAllShipments(); }

    @ApiOperation({ summary: 'Get all RTOs' })
    @Get('rto')
    getRTO() { return this.svc.getAllRTO(); }

    @ApiOperation({ summary: 'Get all tickets' })
    @Get('tickets')
    getTickets() { return this.svc.getAllTickets(); }

    @ApiOperation({ summary: 'Get system activity logs' })
    @Get('logs')
    getLogs() { return this.svc.getLogs(); }

    @ApiOperation({ summary: 'Append a new log entry' })
    @Post('logs')
    appendLog(@Body() body: AppendLogDto) { return this.svc.appendLog(body); }

    @ApiOperation({ summary: 'Get system configuration' })
    @Get('config')
    getConfig() { return this.svc.getConfig(); }

    @ApiOperation({ summary: 'Update system configuration (thresholds, limits)' })
    @Put('config')
    setConfig(@Body() body: SetConfigDto) { return this.svc.setConfig(body); }
}
