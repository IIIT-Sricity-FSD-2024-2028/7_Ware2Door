import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class TicketRepository {
    private ticketsPath = join(__dirname, 'tickets.json');
    private shipmentsPath = join(__dirname, '../shipments/shipments.json');

    async isValidTrackingId(trackingId: string): Promise<boolean> {
        const content = await readFile(this.shipmentsPath, 'utf-8');
        const data = JSON.parse(content);
        return data.shipments.some((s: any) => s.trackingId === trackingId);
    }

    async getShipmentByTrackingId(trackingId: string): Promise<any | null> {
        const content = await readFile(this.shipmentsPath, 'utf-8');
        const data = JSON.parse(content);
        return data.shipments.find((s: any) => s.trackingId === trackingId) || null;
    }

    async createTicket(payload: { trackingId: string; category: string; description: string }): Promise<any> {
        const content = await readFile(this.ticketsPath, 'utf-8');
        const data = JSON.parse(content);

        const shipment = await this.getShipmentByTrackingId(payload.trackingId);

        const priorityMap: any = {
            'Damaged Package': 'High',
            'Delivery Failed': 'High',
            'Wrong Item': 'High',
            'Delayed Delivery': 'Medium',
            'Address Issue': 'Medium',
            'General': 'Low',
        };

        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const newTicket = {
            ticketId: 'TKT-' + Math.floor(1000 + Math.random() * 9000),
            trackingId: payload.trackingId,
            subject: `${payload.category} — ${payload.trackingId}`,
            status: 'Open',
            created: formattedDate,
            assigned: 'Agency Manager',
            priority: priorityMap[payload.category] || 'Low',
            agencyId: shipment?.agencyId || null,
            custName: shipment?.customerName || '—',
            custPhone: shipment?.customerPhone || '—',
            custAddr: shipment?.customerAddress || '—',
            issue: payload.description || '',
            category: payload.category || 'General',
            raisedAt: now.toISOString(),
        };
        data.tickets.push(newTicket);
        await writeFile(this.ticketsPath, JSON.stringify(data, null, 4));
        return newTicket;
    }

    async getAllTickets(): Promise<any[]> {
        const content = await readFile(this.ticketsPath, 'utf-8');
        return JSON.parse(content).tickets;
    }

    async getTicketsByAgency(agencyId: string): Promise<any[]> {
        const content = await readFile(this.ticketsPath, 'utf-8');
        const data = JSON.parse(content);
        return data.tickets.filter((t: any) => t.agencyId === agencyId);
    }

    async resolveTicket(ticketId: string): Promise<any> {
        const content = await readFile(this.ticketsPath, 'utf-8');
        const data = JSON.parse(content);
        const ticket = data.tickets.find((t: any) => t.ticketId === ticketId);
        if (!ticket) return { success: false, error: 'Ticket not found' };
        ticket.status = 'Resolved';
        ticket.resolvedAt = new Date().toISOString();
        await writeFile(this.ticketsPath, JSON.stringify(data, null, 4));
        return { success: true, ticket };
    }

    async updateStatus(ticketId: string, status: string): Promise<any> {
        const content = await readFile(this.ticketsPath, 'utf-8');
        const data = JSON.parse(content);
        const ticket = data.tickets.find((t: any) => t.ticketId === ticketId);
        if (!ticket) return { success: false, error: 'Ticket not found' };
        ticket.status = status;
        if (status === 'Resolved') ticket.resolvedAt = new Date().toISOString();
        ticket.updatedAt = new Date().toISOString();
        await writeFile(this.ticketsPath, JSON.stringify(data, null, 4));
        return { success: true, ticket };
    }
}
