import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { Role } from '../auth/roles.enum';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
    constructor(private readonly ticketService: TicketService) {}

    @Public()
    @ApiOperation({ summary: 'Raise a new support ticket (public)' })
    @Post('raise')
    raiseTicket(@Body() body: CreateTicketDto) {
        return this.ticketService.raiseTicket(body);
    }

    @Public()
    @ApiOperation({ summary: 'Validate a tracking ID before raising a ticket (public)' })
    @ApiParam({ name: 'trackingId', description: 'Shipment tracking ID' })
    @Get('validate/:trackingId')
    validateTrackingId(@Param('trackingId') trackingId: string) {
        return this.ticketService.validateTrackingId(trackingId);
    }

    @Public()
    @ApiOperation({ summary: 'Get all tickets (public)' })
    @Get('all')
    getAllTickets() { return this.ticketService.getAllTickets(); }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Get tickets by agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('agency/:agencyId')
    getTicketsByAgency(@Param('agencyId') agencyId: string) {
        return this.ticketService.getTicketsByAgency(agencyId);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Resolve a ticket' })
    @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post(':ticketId/resolve')
    resolveTicket(@Param('ticketId') ticketId: string) {
        return this.ticketService.resolveTicket(ticketId);
    }

    @ApiSecurity('x-role')
    @ApiOperation({ summary: 'Update ticket status' })
    @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Post(':ticketId/status')
    updateStatus(@Param('ticketId') ticketId: string, @Body() body: UpdateTicketStatusDto) {
        return this.ticketService.updateStatus(ticketId, body.status);
    }
}

