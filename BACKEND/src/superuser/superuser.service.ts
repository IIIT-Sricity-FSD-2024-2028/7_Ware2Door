import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class SuperuserService {
    private dataPath = join(process.cwd(), 'src', 'node', 'data.json');
    private ticketsPath = join(process.cwd(), 'src', 'tickets', 'tickets.json');
    private thirdPartiesPath = join(process.cwd(), 'src', 'admin-teams', 'third-parties.json');
    private shipPath = join(process.cwd(), 'src', 'shipments', 'shipments.json');
    private stockPath = join(process.cwd(), 'src', 'node', 'warehouse-stock.json');
    private pendPath = join(process.cwd(), 'src', 'node', 'pending-shipments.json');
    private rtoPath = join(process.cwd(), 'src', 'rto', 'rto.json');
    private agentsPath = join(process.cwd(), 'src', 'workers', 'agents.json');
    private agShipPath = join(process.cwd(), 'src', 'node', 'agency-shipments.json');

    private async readJson(filePath: string): Promise<any> {
        try {
            const raw = await readFile(filePath, 'utf-8');
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }

    async getNodes() {
        const data = await this.readJson(this.dataPath);
        const cats = ['WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_AGENCY'];
        let allNodes: any[] = [];
        for (const cat of cats) {
            if (data[cat]) {
                allNodes = allNodes.concat(data[cat].map((n: any) => ({
                    id: n.id,
                    name: n.name,
                    city: n.city,
                    type: n.type || cat,
                    isActive: n.isActive,
                    isSubscriptionValid: !!(n.subscription?.endDate && new Date(n.subscription.endDate) > new Date()),
                    subscriptionEndDate: n.subscription?.endDate ?? null,
                })));
            }
        }
        return allNodes;
    }

    async getEscalations() {
        const data = await this.readJson(this.ticketsPath);
        return (data.tickets || []).map((t: any) => ({
            ticketId: t.ticketId,
            trackingId: t.trackingId,
            priority: t.priority,
            escalationStatus: t.escalationStatus || 'Pending',
            resolved: t.escalationStatus === 'Resolved' || t.status === 'Resolved',
        }));
    }

    async getThirdParties() {
        const data = await this.readJson(this.thirdPartiesPath);
        const TIERS: Record<string, number> = { Starter: 100, Growth: 500, Business: 2000, Enterprise: 10000 };
        return (data.partners || []).map((p: any) => {
            const maxAllowed = p.tierLimits?.maxShipmentsPerMonth ?? TIERS[p.tier] ?? 100;
            const usage = p.currentMonthUsage || 0;
            return {
                id: p.id,
                name: p.name,
                tier: p.tier,
                isActive: p.isActive,
                currentMonthUsage: usage,
                limit: maxAllowed,
                withinLimit: usage < maxAllowed,
            };
        });
    }

    async getNodePerformance() {
        const data = await this.readJson(this.dataPath);
        const ships = await this.readJson(this.shipPath);
        const stock = await this.readJson(this.stockPath);
        const pend = await this.readJson(this.pendPath);
        const rtos = await this.readJson(this.rtoPath).catch(() => []);
        const agents = await this.readJson(this.agentsPath).catch(() => ({}));
        const agShips = await this.readJson(this.agShipPath).catch(() => ({}));
        const shipments = ships.shipments || [];

        const warehouses = (data['WAREHOUSE'] || []).map((wh: any) => {
            const inv: any[] = stock[wh.id] || [];
            const pendReq: any[] = pend[wh.id] || [];
            const rtoList = Array.isArray(rtos) ? rtos.filter((r: any) => r.warehouseId === wh.id) : [];
            const totalQty = inv.reduce((s: number, i: any) => s + (i.quantity || 0), 0);
            return { id: wh.id, name: wh.name, inventory: totalQty, pending: pendReq.length, rto: rtoList.length, isActive: wh.isActive };
        });

        const hubs = (data['TRANSIT_HUB'] || []).map((hub: any) => {
            const inScanned = shipments.filter((s: any) => s.hubId === hub.id && s.status === 'In Scan at Transit Hub').length;
            const outScanned = shipments.filter((s: any) => s.hubId === hub.id && s.status === 'Out Scan at Transit Hub').length;
            const totalAtHub = shipments.filter((s: any) => s.hubId === hub.id).length;
            const capacity = hub.capacity > 0 ? Math.min(100, Math.round((totalAtHub / hub.capacity) * 100)) : 0;
            return { id: hub.id, name: hub.name, inScanned, outScanned, capacity, isActive: hub.isActive };
        });

        const agencies = (data['LOCAL_AGENCY'] || []).map((ag: any) => {
            const agentList: any[] = agents[ag.id] || [];
            const agState = agShips[ag.id] || {};
            const deliveries: any[] = agState.deliveries || [];
            const delivered = deliveries.filter((d: any) => d.status === 'Delivered').length;
            const rtoRaised = (agState.rto || []).length;
            return { id: ag.id, name: ag.name, agents: agentList.length, deliveredToday: delivered, rtoRaised, isActive: ag.isActive };
        });

        return { warehouses, hubs, agencies };
    }
}
