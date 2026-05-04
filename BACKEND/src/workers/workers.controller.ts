import { Controller, Get, Post, Delete, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam, ApiBody } from '@nestjs/swagger';
import { WorkersService } from './workers.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@ApiTags('Workers & Agents')
@ApiSecurity('x-role')
@Controller()
export class WorkersController {
    constructor(public workersService: WorkersService) {}

    @ApiOperation({ summary: 'Get all agents for an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/agents')
    getAgents(@Param('agencyId') agencyId: string) {
        return this.workersService.getAgents(agencyId);
    }

    @ApiOperation({ summary: 'Add a new delivery agent to an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/agents')
    addAgent(@Body() body: CreateAgentDto, @Param('agencyId') agencyId: string) {
        const agent = { id: `AGT-${agencyId.toUpperCase()}-${Date.now()}`, name: body.name, phone: body.phone, email: body.email || '', area: body.area, status: 'Active', assigned: 0 };
        return this.workersService.addAgent(agencyId, agent);
    }

    @ApiOperation({ summary: 'Remove a delivery agent from an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @ApiParam({ name: 'agentId', description: 'Agent ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Delete('/agency/:agencyId/agents/:agentId')
    removeAgent(@Param('agencyId') agencyId: string, @Param('agentId') agentId: string) {
        return this.workersService.removeAgent(agencyId, agentId);
    }

    @ApiOperation({ summary: "Edit a delivery agent's details" })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @ApiParam({ name: 'agentId', description: 'Agent ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Put('/agency/:agencyId/agents/:agentId')
    editAgent(@Body() body: UpdateAgentDto, @Param('agencyId') agencyId: string, @Param('agentId') agentId: string) {
        return this.workersService.editAgent(agencyId, agentId, body);
    }

    @ApiOperation({ summary: 'Assign an agent to a shipment' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/assignAgent')
    assignAgent(@Body() body: AssignAgentDto, @Param('agencyId') agencyId: string) {
        return this.workersService.assignAgentToShipment(agencyId, body.trackingId, body.agentId);
    }

    @ApiOperation({ summary: 'Get all agent-shipment assignments for an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/assignments')
    getAllAssignments(@Param('agencyId') agencyId: string) {
        return this.workersService.getAllAssignments(agencyId);
    }

    @ApiOperation({ summary: 'Get assignment details for a specific shipment' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @ApiParam({ name: 'trackingId', description: 'Shipment tracking ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/assignments/:trackingId')
    getAssignment(@Param('agencyId') agencyId: string, @Param('trackingId') trackingId: string) {
        return this.workersService.getAssignment(agencyId, trackingId);
    }

    @ApiOperation({ summary: 'Get all drivers' })
    @Roles(Role.WAREHOUSE)
    @Get('/drivers')
    getAllDrivers() {
        return this.workersService.getAllDrivers();
    }

    @ApiOperation({ summary: 'Get driver by route key' })
    @ApiParam({ name: 'routeKey', description: 'Route key' })
    @Roles(Role.WAREHOUSE)
    @Get('/drivers/:routeKey')
    getDriverByRoute(@Param('routeKey') routeKey: string) {
        return this.workersService.getDriverByRoute(routeKey);
    }

    @ApiOperation({ summary: 'Set or update a driver for a route' })
    @ApiParam({ name: 'routeKey', description: 'Route key' })
    @ApiBody({ schema: { type: 'object', properties: { name: { type: 'string', example: 'Rajesh Kumar' }, vehicle: { type: 'string', example: 'TN-01-AB-1234' } } } })
    @Roles(Role.WAREHOUSE)
    @Put('/drivers/:routeKey')
    setDriver(@Body() body: { name: string; vehicle: string }, @Param('routeKey') routeKey: string) {
        return this.workersService.setDriver(routeKey, body.name, body.vehicle);
    }

    @ApiOperation({ summary: 'Delete a driver from a route' })
    @ApiParam({ name: 'routeKey', description: 'Route key' })
    @Roles(Role.WAREHOUSE)
    @Delete('/drivers/:routeKey')
    deleteDriver(@Param('routeKey') routeKey: string) {
        return this.workersService.deleteDriver(routeKey);
    }
}
