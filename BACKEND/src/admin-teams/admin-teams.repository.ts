import { Injectable, NotFoundException } from '@nestjs/common';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AdminTeamsRepository {
    private dataPath = join(process.cwd(), 'src', 'node', 'data.json');
    private driversPath = join(process.cwd(), 'src', 'admin-teams', 'drivers.json');
    private workersPath = join(process.cwd(), 'src', 'workers', 'drivers.json');
    private ticketsPath = join(process.cwd(), 'src', 'tickets', 'tickets.json');
    private uploadRoot = join(process.cwd(), 'uploads', 'legal-docs');
    private partnersPath = join(process.cwd(), 'src', 'admin-teams', 'third-parties.json');

    private async readJson(path: string): Promise<any> {
        const raw = await readFile(path, 'utf-8').catch(() => '{}');
        return JSON.parse(raw);
    }

    private async writeJson(path: string, data: any) {
        await writeFile(path, JSON.stringify(data, null, 2));
    }


    async getAllNodes(): Promise<any[]> {
        const data = await this.readJson(this.dataPath);
        const map = (arr: any[], type: string) =>
            (arr || []).map(n => ({ ...n, _type: type, password: undefined }));
        return [
            ...map(data['WAREHOUSE'] || [], 'WAREHOUSE'),
            ...map(data['TRANSIT_HUB'] || [], 'TRANSIT_HUB'),
            ...map(data['LOCAL_AGENCY'] || [], 'LOCAL_AGENCY'),
        ];
    }

    async addNode(body: any): Promise<any> {
        const data = await this.readJson(this.dataPath);
        const typeMap: any = { WareHouse: 'WAREHOUSE', TransitHub: 'TRANSIT_HUB', LocalAgency: 'LOCAL_AGENCY' };
        const cat = typeMap[body.role];
        if (!cat) return { success: false, error: 'Invalid role' };
        if (!data[cat]) data[cat] = [];

        const prefixMap: any = { WAREHOUSE: 'wh', TRANSIT_HUB: 'hub', LOCAL_AGENCY: 'agency' };
        const prefix = prefixMap[cat];
        const existingIds = data[cat].map((u: any) => u.id);
        let num = data[cat].length + 1;
        let newId = `${prefix}-${String(num).padStart(3, '0')}`;
        while (existingIds.includes(newId)) { num++; newId = `${prefix}-${String(num).padStart(3, '0')}`; }

        const entry: any = {
            id: newId,
            name: body.name,
            email: body.email,
            password: body.password,
            phone: body.phone,
            address: body.address,
            city: body.city,
            type: cat,
            isActive: true,
            createdAt: new Date().toISOString(),
            lat: body.lat || null,
            lng: body.lng || null,
            subscription: {
                tier: body.subscription?.tier || 'Starter',
                startDate: body.subscription?.startDate || new Date().toISOString().split('T')[0],
                endDate: body.subscription?.endDate || '',
                monthlyRate: body.subscription?.monthlyRate || 0,
                isActive: true,
            },
            legalDocs: [],
        };
        if (cat === 'TRANSIT_HUB') entry.capacity = 200;
        data[cat].push(entry);
        await this.writeJson(this.dataPath, data);
        const { password, ...safe } = entry;
        return { success: true, node: safe };
    }

    async updateSubscription(nodeId: string, sub: any): Promise<any> {
        const data = await this.readJson(this.dataPath);
        const cats = ['WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_AGENCY'];
        for (const cat of cats) {
            if (!data[cat]) continue;
            const idx = data[cat].findIndex((n: any) => n.id === nodeId);
            if (idx !== -1) {
                data[cat][idx].subscription = { ...(data[cat][idx].subscription || {}), ...sub };
                await this.writeJson(this.dataPath, data);
                return { success: true, subscription: data[cat][idx].subscription };
            }
        }
        return { success: false, error: 'Node not found' };
    }

    async toggleNodeStatus(nodeId: string, isActive: boolean): Promise<any> {
        const data = await this.readJson(this.dataPath);
        const cats = ['WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_AGENCY'];
        for (const cat of cats) {
            if (!data[cat]) continue;
            const idx = data[cat].findIndex((n: any) => n.id === nodeId);
            if (idx !== -1) {
                data[cat][idx].isActive = isActive;
                data[cat][idx].updatedAt = new Date().toISOString();
                if (isActive) data[cat][idx].reactivatedAt = new Date().toISOString();
                await this.writeJson(this.dataPath, data);
                return { success: true, id: nodeId, isActive };
            }
        }
        return { success: false, error: 'Node not found' };
    }

    async addLegalDoc(nodeId: string, fileName: string, filePath: string): Promise<any> {
        const data = await this.readJson(this.dataPath);
        const cats = ['WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_AGENCY'];
        for (const cat of cats) {
            if (!data[cat]) continue;
            const idx = data[cat].findIndex((n: any) => n.id === nodeId);
            if (idx !== -1) {
                if (!data[cat][idx].legalDocs) data[cat][idx].legalDocs = [];
                const doc = { name: fileName, path: filePath, uploadedAt: new Date().toISOString() };
                data[cat][idx].legalDocs.push(doc);
                await this.writeJson(this.dataPath, data);
                return { success: true, doc };
            }
        }
        return { success: false, error: 'Node not found' };
    }

    async getLegalDocs(nodeId: string): Promise<any> {
        const data = await this.readJson(this.dataPath);
        const cats = ['WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_AGENCY'];
        for (const cat of cats) {
            if (!data[cat]) continue;
            const node = data[cat].find((n: any) => n.id === nodeId);
            if (node) return { success: true, docs: node.legalDocs || [] };
        }
        return { success: false, error: 'Node not found' };
    }


    private routeKey(fromId: string, toId: string) {
        return `${fromId}_${toId}`;
    }

    async getAllDrivers(): Promise<any[]> {
        const data = await this.readJson(this.driversPath);
        return data.drivers || [];
    }

    async addDriver(body: any, allNodes: any[]): Promise<any> {
        const data = await this.readJson(this.driversPath);
        if (!data.drivers) data.drivers = [];

        const existingIds = data.drivers.map((d: any) => d.id);
        let num = data.drivers.length + 1;
        let newId = `drv-${String(num).padStart(3, '0')}`;
        while (existingIds.includes(newId)) { num++; newId = `drv-${String(num).padStart(3, '0')}`; }

        const fromNode = allNodes.find((n: any) => n.id === body.fromNodeId);
        const toNode = allNodes.find((n: any) => n.id === body.toNodeId);

        const entry: any = {
            id: newId,
            name: body.name,
            phone: body.phone,
            licenseNo: body.licenseNo,
            vehicleType: body.vehicleType,
            fromNodeId: body.fromNodeId,
            fromNodeType: body.fromNodeType,
            fromNodeName: fromNode?.name || body.fromNodeId,
            toNodeId: body.toNodeId,
            toNodeType: body.toNodeType,
            toNodeName: toNode?.name || body.toNodeId,
            routeKey: this.routeKey(body.fromNodeId, body.toNodeId),
            subscription: {
                startDate: body.startDate,
                endDate: body.endDate,
                monthlyFee: body.monthlyFee,
                isActive: true,
            },
            isActive: true,
            createdAt: new Date().toISOString(),
        };
        data.drivers.push(entry);
        await this.writeJson(this.driversPath, data);

        const workers = await this.readJson(this.workersPath);
        const key = this.routeKey(body.fromNodeId, body.toNodeId);
        workers[key] = { name: body.name, vehicle: body.licenseNo };
        await this.writeJson(this.workersPath, workers);

        return { success: true, driver: entry };
    }

    async updateDriver(id: string, body: any): Promise<any> {
        const data = await this.readJson(this.driversPath);
        const idx = (data.drivers || []).findIndex((d: any) => d.id === id);
        if (idx === -1) return { success: false, error: 'Driver not found' };
        const d = data.drivers[idx];
        const oldKey = this.routeKey(d.fromNodeId, d.toNodeId);

        if (body.name) d.name = body.name;
        if (body.phone) d.phone = body.phone;
        if (body.licenseNo) d.licenseNo = body.licenseNo;
        if (body.vehicleType) d.vehicleType = body.vehicleType;
        if (body.endDate) d.subscription.endDate = body.endDate;
        if (body.monthlyFee !== undefined) d.subscription.monthlyFee = body.monthlyFee;
        d.updatedAt = new Date().toISOString();
        await this.writeJson(this.driversPath, data);

        const workers = await this.readJson(this.workersPath);
        if (workers[oldKey]) {
            workers[oldKey] = { name: d.name, vehicle: d.licenseNo };
            await this.writeJson(this.workersPath, workers);
        }
        return { success: true, driver: d };
    }

    async deleteDriver(id: string): Promise<any> {
        const data = await this.readJson(this.driversPath);
        const idx = (data.drivers || []).findIndex((d: any) => d.id === id);
        if (idx === -1) return { success: false, error: 'Driver not found' };
        const [removed] = data.drivers.splice(idx, 1);
        await this.writeJson(this.driversPath, data);

        const workers = await this.readJson(this.workersPath);
        const key = this.routeKey(removed.fromNodeId, removed.toNodeId);
        if (workers[key]) {
            delete workers[key];
            await this.writeJson(this.workersPath, workers);
        }
        return { success: true };
    }


    async getAllEscalations(): Promise<any[]> {
        const data = await this.readJson(this.ticketsPath);
        return (data.tickets || []).filter((t: any) => t.status === 'Escalated');
    }

    async escalateTicket(ticketId: string, note: string, assignedTo?: string): Promise<any> {
        const data = await this.readJson(this.ticketsPath);
        const ticket = (data.tickets || []).find((t: any) => t.ticketId === ticketId);
        if (!ticket) return { success: false, error: 'Ticket not found' };
        ticket.status = 'Escalated';
        ticket.escalatedAt = new Date().toISOString();
        ticket.escalationNote = note;
        ticket.escalationStatus = 'Pending';
        if (assignedTo) ticket.escalationAssignedTo = assignedTo;
        await this.writeJson(this.ticketsPath, data);
        return { success: true, ticket };
    }

    async updateEscalation(ticketId: string, body: any): Promise<any> {
        const data = await this.readJson(this.ticketsPath);
        const ticket = (data.tickets || []).find((t: any) => t.ticketId === ticketId);
        if (!ticket) return { success: false, error: 'Ticket not found' };
        if (body.status) ticket.status = body.status;
        if (body.escalationStatus) ticket.escalationStatus = body.escalationStatus;
        if (body.escalationAssignedTo) ticket.escalationAssignedTo = body.escalationAssignedTo;
        if (body.resolutionNote) ticket.resolutionNote = body.resolutionNote;
        if (body.status === 'Resolved') ticket.resolvedAt = new Date().toISOString();
        await this.writeJson(this.ticketsPath, data);
        return { success: true, ticket };
    }

    async ensureUploadDir(nodeId: string): Promise<string> {
        const dir = join(this.uploadRoot, nodeId);
        if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true });
        }
        return dir;
    }

    async getNodePerformance(): Promise<any> {
        const dataPath = join(process.cwd(), 'src', 'node', 'data.json');
        const shipPath = join(process.cwd(), 'src', 'shipments', 'shipments.json');
        const stockPath = join(process.cwd(), 'src', 'node', 'warehouse-stock.json');
        const pendPath = join(process.cwd(), 'src', 'node', 'pending-shipments.json');
        const rtoPath = join(process.cwd(), 'src', 'rto', 'rto.json');
        const agentsPath = join(process.cwd(), 'src', 'workers', 'agents.json');
        const agShipPath = join(process.cwd(), 'src', 'node', 'agency-shipments.json');

        const data = await this.readJson(dataPath);
        const ships = await this.readJson(shipPath);
        const stock = await this.readJson(stockPath);
        const pend = await this.readJson(pendPath);
        const rtos = await this.readJson(rtoPath).catch(() => []);
        const agents = await this.readJson(agentsPath).catch(() => ({}));
        const agShips = await this.readJson(agShipPath).catch(() => ({}));
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
    private generateApiKey(): string {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const rand = Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `wh2d_tp_${rand}`;
    }

    private getTierLimits(tier: string): { name: string; maxShipmentsPerMonth: number; monthlyFee: number } {
        const tiers: Record<string, { name: string; maxShipmentsPerMonth: number; monthlyFee: number }> = {
            Starter: { name: 'Starter', maxShipmentsPerMonth: 100, monthlyFee: 2000 },
            Growth: { name: 'Growth', maxShipmentsPerMonth: 500, monthlyFee: 8000 },
            Business: { name: 'Business', maxShipmentsPerMonth: 2000, monthlyFee: 25000 },
            Enterprise: { name: 'Enterprise', maxShipmentsPerMonth: 10000, monthlyFee: 50000 },
        };
        return tiers[tier] ?? tiers['Starter'];
    }

    async getAllPartners(): Promise<any[]> {
        const data = await this.readJson(this.partnersPath).catch(() => ({ partners: [] }));
        return (data.partners || []).map((p: any) => ({ ...p, apiKey: p.apiKey }));
    }

    async addPartner(body: any): Promise<any> {
        const data = await this.readJson(this.partnersPath).catch(() => ({ partners: [] }));
        if (!data.partners) data.partners = [];
        const existing = data.partners.find((p: any) => p.email === body.email);
        if (existing) return { success: false, error: 'A partner with this email already exists.' };
        const num = data.partners.length + 1;
        const id = `tp-${String(num).padStart(3, '0')}`;
        const apiKey = this.generateApiKey();
        const entry: any = {
            id,
            name: body.name,
            email: body.email,
            apiKey,
            tier: body.tier || 'Starter',
            tierLimits: this.getTierLimits(body.tier || 'Starter'),
            currentMonthUsage: 0,
            usageResetMonth: new Date().toISOString().slice(0, 7),
            isActive: true,
            contact: { name: body.contactName || '', phone: body.contactPhone || '' },
            address: body.address || '',
            createdAt: new Date().toISOString(),
        };
        data.partners.push(entry);
        await this.writeJson(this.partnersPath, data);
        return { success: true, partner: entry };
    }

    async setPartnerStatus(id: string, isActive: boolean): Promise<any> {
        const data = await this.readJson(this.partnersPath).catch(() => ({ partners: [] }));
        const partner = (data.partners || []).find((p: any) => p.id === id);
        if (!partner) return { success: false, error: 'Partner not found' };
        partner.isActive = isActive;
        await this.writeJson(this.partnersPath, data);
        return { success: true, partner };
    }

    async changePartnerTier(id: string, tier: string): Promise<any> {
        const data = await this.readJson(this.partnersPath).catch(() => ({ partners: [] }));
        const partner = (data.partners || []).find((p: any) => p.id === id);
        if (!partner) return { success: false, error: 'Partner not found' };
        partner.tier = tier;
        partner.tierLimits = this.getTierLimits(tier);
        await this.writeJson(this.partnersPath, data);
        return { success: true, partner };
    }

    async deletePartner(id: string): Promise<any> {
        const data = await this.readJson(this.partnersPath).catch(() => ({ partners: [] }));
        const idx = (data.partners || []).findIndex((p: any) => p.id === id);
        if (idx === -1) return { success: false, error: 'Partner not found' };
        data.partners.splice(idx, 1);
        await this.writeJson(this.partnersPath, data);
        return { success: true };
    }

    async regenerateApiKey(id: string): Promise<any> {
        const data = await this.readJson(this.partnersPath).catch(() => ({ partners: [] }));
        const partner = (data.partners || []).find((p: any) => p.id === id);
        if (!partner) return { success: false, error: 'Partner not found' };
        partner.apiKey = this.generateApiKey();
        await this.writeJson(this.partnersPath, data);
        return { success: true, apiKey: partner.apiKey };
    }
}

