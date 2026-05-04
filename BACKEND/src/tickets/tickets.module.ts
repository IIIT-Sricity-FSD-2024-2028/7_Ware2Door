import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { TicketRepository } from './ticket.repository';

@Module({
    controllers: [TicketController],
    providers: [TicketService, TicketRepository],
})
export class TicketsModule {}
