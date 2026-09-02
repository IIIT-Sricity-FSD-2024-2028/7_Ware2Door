import { Controller, Get, Post, Delete, Put, Body, Param, UseFilters, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam, ApiBody } from '@nestjs/swagger';
import { WorkersService } from './workers.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { AllExceptionsFilter } from '../common/all-exceptions.filter';
import { ModuleLogger } from '../common/module-logger';
import { AccountThrottlerGuard } from '../auth/account-throttler.guard';

@ApiTags('Workers & Agents')
@ApiSecurity('x-role')
@UseFilters(AllExceptionsFilter, HttpExceptionFilter)
@UseGuards(AccountThrottlerGuard)
@Controller()
export class WorkersController {
    private readonly logger = new ModuleLogger('workers');

    constructor(public workersService: WorkersService) {}

    @ApiOperation({ summary: 'Get all agents for an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/agents')
    getAgents(@Param('agencyId') agencyId: string) {
        this.logger.log(`getAgents → agency=${agencyId}`);
        return this.workersService.getAgents(agencyId);
    }

    @ApiOperation({ summary: 'Add a new delivery agent to an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/agents')
    addAgent(@Body() body: CreateAgentDto, @Param('agencyId') agencyId: string) {
        this.logger.log(`addAgent → agency=${agencyId} name=${body.name}`);
        const agent = { id: `AGT-${agencyId.toUpperCase()}-${Date.now()}`, name: body.name, phone: body.phone, email: body.email || '', area: body.area, status: 'Active', assigned: 0 };
        return this.workersService.addAgent(agencyId, agent);
    }

    @ApiOperation({ summary: 'Remove a delivery agent from an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @ApiParam({ name: 'agentId', description: 'Agent ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Delete('/agency/:agencyId/agents/:agentId')
    removeAgent(@Param('agencyId') agencyId: string, @Param('agentId') agentId: string) {
        this.logger.warn(`removeAgent → agency=${agencyId} agent=${agentId}`);
        return this.workersService.removeAgent(agencyId, agentId);
    }

    @ApiOperation({ summary: "Edit a delivery agent's details" })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @ApiParam({ name: 'agentId', description: 'Agent ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Put('/agency/:agencyId/agents/:agentId')
    editAgent(@Body() body: UpdateAgentDto, @Param('agencyId') agencyId: string, @Param('agentId') agentId: string) {
        this.logger.log(`editAgent → agency=${agencyId} agent=${agentId}`);
        return this.workersService.editAgent(agencyId, agentId, body);
    }

    @ApiOperation({ summary: 'Assign an agent to a shipment' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/assignAgent')
    assignAgent(@Body() body: AssignAgentDto, @Param('agencyId') agencyId: string) {
        this.logger.log(`assignAgent → agency=${agencyId} agent=${body.agentId} tracking=${body.trackingId}`);
        return this.workersService.assignAgentToShipment(agencyId, body.trackingId, body.agentId);
    }

    @ApiOperation({ summary: 'Get all agent-shipment assignments for an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/assignments')
    getAllAssignments(@Param('agencyId') agencyId: string) {
        this.logger.log(`getAllAssignments → agency=${agencyId}`);
        return this.workersService.getAllAssignments(agencyId);
    }

    @ApiOperation({ summary: 'Get assignment details for a specific shipment' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @ApiParam({ name: 'trackingId', description: 'Shipment tracking ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/assignments/:trackingId')
    getAssignment(@Param('agencyId') agencyId: string, @Param('trackingId') trackingId: string) {
        this.logger.log(`getAssignment → agency=${agencyId} tracking=${trackingId}`);
        return this.workersService.getAssignment(agencyId, trackingId);
    }

    @ApiOperation({ summary: 'Get all drivers' })
    @Roles(Role.WAREHOUSE)
    @Get('/drivers')
    getAllDrivers() {
        this.logger.log('getAllDrivers');
        return this.workersService.getAllDrivers();
    }

    @ApiOperation({ summary: 'Get driver by route key' })
    @ApiParam({ name: 'routeKey', description: 'Route key' })
    @Roles(Role.WAREHOUSE)
    @Get('/drivers/:routeKey')
    getDriverByRoute(@Param('routeKey') routeKey: string) {
        this.logger.log(`getDriver → route=${routeKey}`);
        return this.workersService.getDriverByRoute(routeKey);
    }

    @ApiOperation({ summary: 'Set or update a driver for a route' })
    @ApiParam({ name: 'routeKey', description: 'Route key' })
    @ApiBody({ schema: { type: 'object', properties: { name: { type: 'string', example: 'Rajesh Kumar' }, vehicle: { type: 'string', example: 'TN-01-AB-1234' } } } })
    @Roles(Role.WAREHOUSE)
    @Put('/drivers/:routeKey')
    setDriver(@Body() body: { name: string; vehicle: string }, @Param('routeKey') routeKey: string) {
        this.logger.log(`setDriver → route=${routeKey} name=${body.name} vehicle=${body.vehicle}`);
        return this.workersService.setDriver(routeKey, body.name, body.vehicle);
    }

    @ApiOperation({ summary: 'Delete a driver from a route' })
    @ApiParam({ name: 'routeKey', description: 'Route key' })
    @Roles(Role.WAREHOUSE)
    @Delete('/drivers/:routeKey')
    deleteDriver(@Param('routeKey') routeKey: string) {
        this.logger.warn(`deleteDriver → route=${routeKey}`);
        return this.workersService.deleteDriver(routeKey);
    }
}
