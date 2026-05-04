import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class SuperUserRepository {
    private dataPath    = join(__dirname, '..', 'node', 'data.json');
    private stockPath   = join(__dirname, '..', 'node', 'warehouse-stock.json');
    private pendPath    = join(__dirname, '..', 'node', 'pending-shipments.json');
    private shipPath    = join(__dirname, '..', 'shipments', 'shipments.json');
    private rtoPath     = join(__dirname, '..', 'rto', 'rto.json');
    private agentsPath  = join(__dirname, '..', 'workers', 'agents.json');
    private scanPath    = join(__dirname, '..', 'workers', 'drivers.json');
    private logsPath    = join(__dirname, 'su-logs.json');
    private ticketsPath = join(__dirname, '..', 'tickets', 'tickets.json');
    private agShipPath  = join(__dirname, '..', 'node', 'agency-shipments.json');
    private configPath  = join(__dirname, '..', 'node', 'config.json');

    private async readJson(path: string): Promise<any> {
        const raw = await readFile(path, 'utf-8').catch(() => '{}');
        return JSON.parse(raw);
    }

    private async writeJson(path: string, data: any) {
        await writeFile(path, JSON.stringify(data, null, 2));
    }

    async getOverview() {
        const data = await this.readJson(this.dataPath);
        const ships = await this.readJson(this.shipPath);
        const rtos  = await this.readJson(this.rtoPath).catch(() => []);
        const shipments  = ships.shipments || [];
        const warehouses = data['WAREHOUSE'] || [];
        const hubs       = data['TRANSIT_HUB'] || [];
        const agencies   = data['LOCAL_AGENCY'] || [];
        const allAdmins  = [...warehouses, ...hubs, ...agencies];
        const delivered  = shipments.filter((s: any) => s.status === 'Delivered').length;
        const rtoCount   = Array.isArray(rtos) ? rtos.length : 0;
        return {
            totalWarehouses: warehouses.length,
            totalHubs: hubs.length,
            totalAgencies: agencies.length,
            totalAdmins: allAdmins.length,
            totalShipments: shipments.length,
            deliveredShipments: delivered,
            rtoCount,
        };
    }

    async getAllAdmins() {
        const data = await this.readJson(this.dataPath);
        const map = (arr: any[], type: string) => (arr || []).map((u: any) => ({ ...u, _type: type }));
        return [
            ...map(data['WAREHOUSE'], 'WareHouse'),
            ...map(data['TRANSIT_HUB'], 'TransitHub'),
            ...map(data['LOCAL_AGENCY'], 'LocalAgency'),
        ];
    }

    async createAdmin(body: any) {
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
        const entry = {
            id: newId, name: body.name, email: body.email,
            password: body.password || 'admin123', phone: body.phone || '',
            type: cat, isActive: true,
            createdAt: new Date().toISOString(),
            address: body.city || '',
            ...(cat === 'TRANSIT_HUB' ? { capacity: 200 } : {}),
            lat: null, lng: null,
        };
        data[cat].push(entry);
        await this.writeJson(this.dataPath, data);
        return { success: true, admin: { ...entry, _type: body.role } };
    }

    async updateAdmin(id: string, body: any) {
        const data = await this.readJson(this.dataPath);
        const cats = ['WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_AGENCY'];
        for (const cat of cats) {
            if (!data[cat]) continue;
            const idx = data[cat].findIndex((u: any) => u.id === id);
            if (idx !== -1) {
                if (body.name)  data[cat][idx].name  = body.name;
                if (body.email) data[cat][idx].email = body.email;
                if (body.phone) data[cat][idx].phone = body.phone;
                await this.writeJson(this.dataPath, data);
                return { success: true };
            }
        }
        return { success: false, error: 'Admin not found' };
    }

    async deleteAdmin(id: string) {
        const data = await this.readJson(this.dataPath);
        const cats = ['WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_AGENCY'];
        for (const cat of cats) {
            if (!data[cat]) continue;
            const idx = data[cat].findIndex((u: any) => u.id === id);
            if (idx !== -1) {
                data[cat].splice(idx, 1);
                await this.writeJson(this.dataPath, data);
                return { success: true };
            }
        }
        return { success: false, error: 'Admin not found' };
    }

    async setAdminStatus(id: string, active: boolean) {
        const data = await this.readJson(this.dataPath);
        const cats = ['WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_AGENCY'];
        for (const cat of cats) {
            if (!data[cat]) continue;
            const idx = data[cat].findIndex((u: any) => u.id === id);
            if (idx !== -1) {
                data[cat][idx].isActive = active;
                await this.writeJson(this.dataPath, data);
                return { success: true };
            }
        }
        return { success: false, error: 'Admin not found' };
    }

    async getWarehouses() {
        const data  = await this.readJson(this.dataPath);
        const stock = await this.readJson(this.stockPath);
        const pend  = await this.readJson(this.pendPath);
        const ships = await this.readJson(this.shipPath);
        const rtos  = await this.readJson(this.rtoPath).catch(() => []);
        const shipments = ships.shipments || [];
        return (data['WAREHOUSE'] || []).map((wh: any) => {
            const inv: any[]     = stock[wh.id] || [];
            const pendReq: any[] = pend[wh.id] || [];
            const rtoList = Array.isArray(rtos) ? rtos.filter((r: any) => r.warehouseId === wh.id) : [];
            const totalQty = inv.reduce((s: number, i: any) => s + (i.quantity || 0), 0);
            return {
                id: wh.id, name: wh.name, email: wh.email, phone: wh.phone,
                address: wh.address, city: wh.city, isActive: wh.isActive,
                inventory: totalQty, pending: pendReq.length, rto: rtoList.length,
                status: wh.isActive !== false ? 'Operational' : 'Critical',
            };
        });
    }

    async getWarehouseDrilldown(id: string) {
        const stock  = await this.readJson(this.stockPath);
        const pend   = await this.readJson(this.pendPath);
        const config = await this.readJson(this.configPath).catch(() => ({ lowStockThreshold: 50 }));
        const threshold = config.lowStockThreshold || 50;
        const invData = (stock[id] || []).map((i: any) => ({
            id: i.labelId, name: i.itemName, qty: i.quantity,
            status: i.quantity <= 0 ? 'Out of Stock' : i.quantity < threshold ? 'Low Stock' : 'In Stock',
        }));
        const pendReq = (pend[id] || []).map((p: any) => ({
            orderId: p.orderId, dest: p.customerAddress || '—', items: p.qty || 1,
        }));
        return { invData, pendReq };
    }

    async cancelAllPending(id: string) {
        const pend = await this.readJson(this.pendPath);
        if (pend[id]) {
            pend[id] = [];
            await this.writeJson(this.pendPath, pend);
        }
        return { success: true };
    }

    async cancelSinglePending(id: string, orderId: string) {
        const pend = await this.readJson(this.pendPath);
        if (pend[id]) {
            pend[id] = pend[id].filter((s: any) => s.orderId !== orderId);
            await this.writeJson(this.pendPath, pend);
        }
        return { success: true };
    }

    async getHubs() {
        const data  = await this.readJson(this.dataPath);
        const ships = await this.readJson(this.shipPath);
        const shipments = ships.shipments || [];
        return (data['TRANSIT_HUB'] || []).map((hub: any) => {
            const inScanned  = shipments.filter((s: any) => s.hubId === hub.id && s.status === 'In Scan at Transit Hub').length;
            const outScanned = shipments.filter((s: any) => s.hubId === hub.id && s.status === 'Out Scan at Transit Hub').length;
            const totalAtHub = shipments.filter((s: any) => s.hubId === hub.id).length;
            const capacity   = hub.capacity > 0 ? Math.min(100, Math.round((totalAtHub / hub.capacity) * 100)) : 0;
            return {
                id: hub.id, name: hub.name, email: hub.email, phone: hub.phone,
                address: hub.address, city: hub.city, isActive: hub.isActive,
                inScanned, outScanned, flagged: 0, capacity,
                status: hub.isActive !== false ? 'Operational' : 'Critical',
            };
        });
    }

    async getHubDrilldown(id: string) {
        const data = await this.readJson(this.shipPath);
        const scans = data.shipments
            .filter((s: any) => s.hubId === id && (s.status === 'In Scan at Transit Hub' || s.status === 'Out Scan at Transit Hub'))
            .map((s: any) => ({
                id: s.trackingId,
                type: s.status === 'In Scan at Transit Hub' ? 'In-Scan' : s.status === 'Out Scan at Transit Hub' ? 'Out-Scan' : s.status,
                time: s.updatedAt?.[s.updatedAt.length - 1] || new Date().toISOString(),
            }))
            .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 10);
        return { scans };
    }

    async outscanAllHubShipments(id: string) {
        const data = await this.readJson(this.shipPath);
        let updatedCount = 0;
        for (const s of data.shipments) {
            if (s.hubId === id && s.status === 'In Scan at Transit Hub') {
                s.status = 'Out Scan at Transit Hub';
                if (!s.updatedAt) s.updatedAt = [];
                s.updatedAt.push(new Date().toISOString());
                updatedCount++;
            }
        }
        if (updatedCount > 0) {
            await this.writeJson(this.shipPath, data);
        }
        return { success: true, count: updatedCount };
    }

    async getAgencies() {
        const data    = await this.readJson(this.dataPath);
        const agents  = await this.readJson(this.agentsPath);
        const agShips = await this.readJson(this.agShipPath).catch(() => ({}));
        return (data['LOCAL_AGENCY'] || []).map((ag: any) => {
            const agentList: any[]   = agents[ag.id] || [];
            const agState            = agShips[ag.id] || {};
            const deliveries: any[]  = agState.deliveries || [];
            const delivered  = deliveries.filter((d: any) => d.status === 'Delivered').length;
            const rtoRaised  = (agState.rto || []).length;
            return {
                id: ag.id, name: ag.name, email: ag.email, phone: ag.phone,
                address: ag.address, city: ag.city, isActive: ag.isActive,
                agents: agentList.length,
                deliveredToday: delivered,
                rtoRaised,
                status: ag.isActive !== false ? 'Operational' : 'Critical',
            };
        });
    }

    async getAgencyDrilldown(id: string) {
        const agents = await this.readJson(this.agentsPath);
        const roster = (agents[id] || []).map((a: any) => ({
            id: a.id, name: a.name, phone: a.phone, status: a.status || 'Active', deliveries: a.assigned || 0,
        }));
        return { agentRoster: roster };
    }

    async updateAgentStatus(id: string, agentId: string, status: string) {
        const agents = await this.readJson(this.agentsPath);
        if (agents[id]) {
            const agent = agents[id].find((a: any) => a.id === agentId);
            if (agent) {
                agent.status = status;
                await this.writeJson(this.agentsPath, agents);
            }
        }
        return { success: true };
    }

    async getAllShipments() {
        const ships = await this.readJson(this.shipPath);
        return ships.shipments || [];
    }

    async getAllRTO() {
        return await this.readJson(this.rtoPath).catch(() => []);
    }

    async getAllTickets() {
        const data = await this.readJson(this.ticketsPath).catch(() => ({ tickets: [] }));
        return data.tickets || [];
    }

    async getLogs() {
        const raw = await readFile(this.logsPath, 'utf-8').catch(() => '[]');
        return JSON.parse(raw);
    }

    async appendLog(entry: any) {
        const logs = await this.getLogs();
        logs.unshift({ ...entry, time: new Date().toISOString() });
        await this.writeJson(this.logsPath, logs);
        return { success: true };
    }

    async getConfig() {
        return await this.readJson(this.configPath).catch(() => ({ lowStockThreshold: 50, maxRtoAttempts: 3 }));
    }

    async setConfig(body: any) {
        let config = await this.getConfig();
        if (body.lowStockThreshold !== undefined) config.lowStockThreshold = parseInt(body.lowStockThreshold, 10);
        if (body.maxRtoAttempts !== undefined)    config.maxRtoAttempts    = parseInt(body.maxRtoAttempts, 10);
        await this.writeJson(this.configPath, config);
        return { success: true, config };
    }
}
