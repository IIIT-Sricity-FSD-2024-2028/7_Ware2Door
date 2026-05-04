import { Injectable } from '@nestjs/common';
import { TicketRepository } from './ticket.repository';

@Injectable()
export class TicketService {
    constructor(private readonly ticketRepo: TicketRepository) {}

    async raiseTicket(body: { trackingId: string; category: string; description: string }) {
        const valid = await this.ticketRepo.isValidTrackingId(body.trackingId);
        if (!valid) return { error: 'Tracking ID not found. Please check and try again.' };
        const ticket = await this.ticketRepo.createTicket(body);
        return { success: true, ticket };
    }

    async validateTrackingId(trackingId: string) {
        const shipment = await this.ticketRepo.getShipmentByTrackingId(trackingId);
        if (!shipment) return { valid: false };
        return { valid: true, trackingId: shipment.trackingId, productName: shipment.productName, status: shipment.status };
    }

    async getAllTickets() { return this.ticketRepo.getAllTickets(); }
    async getTicketsByAgency(agencyId: string) { return this.ticketRepo.getTicketsByAgency(agencyId); }
    async resolveTicket(ticketId: string) { return this.ticketRepo.resolveTicket(ticketId); }
    async updateStatus(ticketId: string, status: string) { return this.ticketRepo.updateStatus(ticketId, status); }
}
