import { Controller, Get, Post, Put, Body, Param, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam, ApiBody } from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { Role } from '../auth/roles.enum';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { AllExceptionsFilter } from '../common/all-exceptions.filter';
import { ModuleLogger } from '../common/module-logger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Tickets')
@UseFilters(AllExceptionsFilter, HttpExceptionFilter)
@Controller('tickets')
export class TicketController {
    private readonly logger = new ModuleLogger('tickets');

    constructor(private readonly ticketService: TicketService) {}

    @Public()
    @Throttle({ auth: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Raise a new support ticket (public)' })
    @Post('raise')
    raiseTicket(@Body() body: CreateTicketDto) {
        this.logger.log(`raiseTicket → tracking=${body.trackingId} category=${body.category}`);
        return this.ticketService.raiseTicket(body);
    }

    @Public()
    @ApiOperation({ summary: 'Validate a tracking ID before raising a ticket (public)' })
    @ApiParam({ name: 'trackingId', description: 'Shipment tracking ID' })
    @Get('validate/:trackingId')
    validateTrackingId(@Param('trackingId') trackingId: string) {
        this.logger.log(`validateTrackingId → ${trackingId}`);
        return this.ticketService.validateTrackingId(trackingId);
    }

    @Public()
    @ApiOperation({ summary: 'Get all tickets (public)' })
    @Get('all')
    getAllTickets() {
        this.logger.log('getAllTickets');
        return this.ticketService.getAllTickets();
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get tickets by agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('agency/:agencyId')
    getTicketsByAgency(@Param('agencyId') agencyId: string) {
        this.logger.log(`getTicketsByAgency → ${agencyId}`);
        return this.ticketService.getTicketsByAgency(agencyId);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Resolve a ticket' })
    @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post(':ticketId/resolve')
    resolveTicket(@Param('ticketId') ticketId: string) {
        this.logger.log(`resolveTicket → ${ticketId}`);
        return this.ticketService.resolveTicket(ticketId);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Update ticket status' })
    @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post(':ticketId/status')
    updateStatus(@Param('ticketId') ticketId: string, @Body() body: UpdateTicketStatusDto) {
        this.logger.log(`updateTicketStatus → ${ticketId} status=${body.status}`);
        return this.ticketService.updateStatus(ticketId, body.status);
    }
    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Escalate a ticket to Central Escalation Desk' })
    @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
    @ApiBody({ schema: { type: 'object', properties: { escalationNote: { type: 'string', example: 'Customer unreachable after 3 attempts' } } } })
    @Roles(Role.LOCAL_AGENCY, Role.SUPER_USER)
    @Put(':ticketId/escalate')
    escalateTicket(@Param('ticketId') ticketId: string, @Body('escalationNote') note: string) {
        this.logger.log(`escalateTicket → ${ticketId}`);
        return this.ticketService.escalateTicket(ticketId, note || 'Escalated by agency');
    }
}
