import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class NodeRepository {
    private filePath1 = join(__dirname, 'data.json');
    private filePath2 = join(__dirname, 'warehouse-stock.json');
    private filePath3 = join(__dirname, '..', 'workers', 'drivers.json');
    private filePath4 = join(__dirname, 'pending-shipments.json');
    private agentsPath = join(__dirname, '..', 'workers', 'agents.json');
    private agencyShipmentsPath = join(__dirname, 'agency-shipments.json');
    private shipmentsPath = join(__dirname, '..', 'shipments', 'shipments.json');
    private configPath = join(__dirname, 'config.json');

    private async readJson(path: string) {
        const c = await readFile(path, 'utf-8').catch(() => '{}');
        return JSON.parse(c);
    }

    private async writeJson(path: string, data: any) {
        await writeFile(path, JSON.stringify(data, null, 2));
    }

    async getMailPassword(type: any) {
        const data = await this.readJson(this.filePath1);
        return data[type];
    }

    async updateProfile(id: string, name: string, email: string, phone: string) {
        const data = await this.readJson(this.filePath1);
        const cats = ['WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_AGENCY', 'SUPERUSER', 'ADMIN'];
        for (const cat of cats) {
            if (!data[cat]) continue;
            const idx = data[cat].findIndex((u: any) => u.id === id);
            if (idx !== -1) {
                if (name) data[cat][idx].name = name;
                if (email) data[cat][idx].email = email;
                if (phone) data[cat][idx].phone = phone;
                await this.writeJson(this.filePath1, data);
                return { success: true };
            }
        }
        return { success: false, error: 'User not found' };
    }

    async updatePassword(id: string, currentPass: string, newPass: string) {
        const data = await this.readJson(this.filePath1);
        const cats = ['WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_AGENCY', 'SUPERUSER', 'ADMIN'];
        for (const cat of cats) {
            if (!data[cat]) continue;
            const idx = data[cat].findIndex((u: any) => u.id === id);
            if (idx !== -1) {
                if (data[cat][idx].password !== currentPass) return { success: false, error: 'Incorrect current password' };
                data[cat][idx].password = newPass;
                data[cat][idx].passwordUpdatedAt = new Date().toISOString();
                await this.writeJson(this.filePath1, data);
                return { success: true };
            }
        }
        return { success: false, error: 'User not found' };
    }

    async checkEmailExists(email: string) {
        const data = await this.readJson(this.filePath1);
        const cats = ['WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_AGENCY', 'SUPERUSER', 'ADMIN'];
        for (const cat of cats) {
            if (!data[cat]) continue;
            const user = data[cat].find((u: any) => u.email === email);
            if (user) return { exists: true };
        }
        return { exists: false };
    }

    async resetPasswordWithEmail(email: string, newPass: string) {
        const data = await this.readJson(this.filePath1);
        const cats = ['WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_AGENCY', 'SUPERUSER', 'ADMIN'];
        for (const cat of cats) {
            if (!data[cat]) continue;
            const idx = data[cat].findIndex((u: any) => u.email === email);
            if (idx !== -1) {
                data[cat][idx].password = newPass;
                data[cat][idx].passwordUpdatedAt = new Date().toISOString();
                await this.writeJson(this.filePath1, data);
                return { success: true };
            }
        }
        return { success: false, error: 'Email not found' };
    }

    async fetchAllInventory(id: string) {
        const data = await this.readJson(this.filePath2);
        return data[id] || [];
    }

    async setItem(label_id: string | null, label_name: string, quantity: number, id: string) {
        const data = await this.readJson(this.filePath2);
        if (!data[id]) data[id] = [];
        let item = label_id
            ? data[id].find((i: any) => i.labelId === label_id && i.itemName === label_name)
            : data[id].find((i: any) => i.itemName === label_name);
        if (item) {
            item.quantity += quantity;
            if (item.quantity < 0) item.quantity = 0;
            item.lastUpdated = new Date().toISOString();
        } else {
            let finalQty = quantity < 0 ? 0 : quantity;
            item = { labelId: label_id || `SYS-${Date.now()}`, itemName: label_name, quantity: finalQty, lastUpdated: new Date().toISOString() };
            data[id].push(item);
        }
        await this.writeJson(this.filePath2, data);
        return item;
    }

    async getDriverInfo(driverId: string) {
        const drivers = await this.readJson(this.filePath3);
        return drivers[driverId] || { name: 'Unregistered Driver', vehicle: 'N/A' };
    }

    async getHubInfo(hubId: string) {
        const data = await this.readJson(this.filePath1);
        const hub = (data['TRANSIT_HUB'] || []).find((h: any) => h.id === hubId);
        return hub ? { name: hub.name, address: hub.address + ', ' + hub.city, lat: hub.lat || null, lng: hub.lng || null } : { name: hubId, address: '', lat: null, lng: null };
    }

    async getHubName(hubId: string) { return (await this.getHubInfo(hubId)).name; }

    async getHubs() {
        const data = await this.readJson(this.filePath1);
        return data['TRANSIT_HUB'] || [];
    }

    async getAgencies() {
        const data = await this.readJson(this.filePath1);
        return data['LOCAL_AGENCY'] || [];
    }

    async getAgencyInfo(agencyId: string) {
        const data = await this.readJson(this.filePath1);
        return (data['LOCAL_AGENCY'] || []).find((a: any) => a.id === agencyId) || null;
    }

    async getAgencyLatLng(agencyId: string): Promise<{ lat: string | null, lng: string | null }> {
        const info = await this.getAgencyInfo(agencyId);
        return { lat: info?.lat || null, lng: info?.lng || null };
    }

    async getAgencyName(agencyId: string) {
        const info = await this.getAgencyInfo(agencyId);
        return info ? info.name : agencyId;
    }

    async getWarehouseName(warehouseId: string) {
        const data = await this.readJson(this.filePath1);
        const wh = (data['WAREHOUSE'] || []).find((w: any) => w.id === warehouseId);
        return wh ? wh.name : warehouseId;
    }

    async getPendingShipments(warehouseId: string) {
        const data = await this.readJson(this.filePath4);
        return data[warehouseId] || [];
    }

    async addPendingShipment(warehouseId: string, shipment: any) {
        const data = await this.readJson(this.filePath4);
        if (!data[warehouseId]) data[warehouseId] = [];
        data[warehouseId].push(shipment);
        await this.writeJson(this.filePath4, data);
        return shipment;
    }

    async removePendingShipment(warehouseId: string, orderId: string) {
        const data = await this.readJson(this.filePath4);
        if (!data[warehouseId]) return null;
        const shipment = data[warehouseId].find((s: any) => s.orderId === orderId);
        data[warehouseId] = data[warehouseId].filter((s: any) => s.orderId !== orderId);
        await this.writeJson(this.filePath4, data);
        return shipment;
    }

    async getShipmentByTracking(trackingId: string) {
        const data = await this.readJson(this.shipmentsPath);
        return data.shipments.find((s: any) => s.trackingId === trackingId) || null;
    }

    async getShipmentsByHub(hubId: string) {
        const data = await this.readJson(this.shipmentsPath);
        return data.shipments.filter((s: any) => s.hubId === hubId);
    }

    async updateShipmentStatus(trackingId: string, newStatus: string) {
        const data = await this.readJson(this.shipmentsPath);
        const shipment = data.shipments.find((s: any) => s.trackingId === trackingId);
        if (!shipment) return null;
        shipment.status = newStatus;
        if (!shipment.updatedAt) shipment.updatedAt = [];
        shipment.updatedAt.push(new Date().toISOString());
        await this.writeJson(this.shipmentsPath, data);
        return shipment;
    }

    async updateShipmentLatLng(trackingId: string, lat: string, lng: string) {
        const data = await this.readJson(this.shipmentsPath);
        const shipment = data.shipments.find((s: any) => s.trackingId === trackingId);
        if (!shipment) return null;
        shipment.lat = lat;
        shipment.lng = lng;
        await this.writeJson(this.shipmentsPath, data);
        return shipment;
    }

    async getHubInventory(hubId: string) {
        const data = await this.readJson(this.shipmentsPath);
        const normalShipments = data.shipments.filter((s: any) => s.hubId === hubId && s.status === 'In Scan at Transit Hub');
        let rtos = [];
        try {
            const rtoData = await this.readJson(join(__dirname, '..', 'rto', 'rto.json'));
            rtos = rtoData.filter((r: any) => r.hubId === hubId && r.status === 'RTO At Hub').map((r: any) => ({
                trackingId: r.rtoId,
                productName: r.productName,
                warehouseId: r.warehouseId,
                hubId: r.hubId,
                agencyId: r.agencyId,
                status: r.status,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
                isRTO: true
            }));
        } catch (e) {
            console.error('Failed to load RTOs for hub inventory', e);
        }
        return [...normalShipments, ...rtos];
    }

    async getOutboundByHub(hubId: string) {
        const data = await this.readJson(this.shipmentsPath);
        return data.shipments.filter((s: any) => s.hubId === hubId && s.status === 'Out Scan at Transit Hub');
    }

    async getHubCapacity(hubId: string) {
        const data = await this.readJson(this.filePath1);
        const hub = (data['TRANSIT_HUB'] || []).find((h: any) => h.id === hubId);
        return hub?.capacity || 200;
    }

    async getAgencyShipments(agencyId: string) {
        const shipData = await this.readJson(this.shipmentsPath);
        const agState = await this.readJson(this.agencyShipmentsPath);
        const deliveries: any[] = agState[agencyId]?.deliveries || [];
        const assignments: any = agState[agencyId]?.agentAssignments || {};
        const shipments = shipData.shipments.filter((s: any) =>
            s.agencyId === agencyId &&
            !['Picked and Packed', 'In Scan at Transit Hub', 'Out Scan at Transit Hub'].includes(s.status)
        );
        const result = [];
        for (const s of shipments) {
            const delEntry = deliveries.find((d: any) => d.trackingId === s.trackingId);
            const whName = await this.getWarehouseName(s.warehouseId);
            const agentId = delEntry?.agentId || assignments[s.trackingId]?.agentId || null;
            const agentName = agentId ? await this.lookupAgentName(agencyId, agentId) : null;
            result.push({
                trackingId: s.trackingId,
                productName: s.productName,
                warehouseName: whName,
                customerName: s.customerName || '—',
                customerPhone: s.customerPhone || '—',
                customerAddress: s.customerAddress || '—',
                agentId: agentId,
                agentName: agentName,
                attemptCount: delEntry?.attemptCount ?? s.attemptCount ?? 0,
                status: delEntry?.status || this.mapShipmentStatus(s.status),
                rawStatus: s.status,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt
            });
        }
        return result;
    }

    mapShipmentStatus(raw: string): string {
        const map: any = {
            'Picked and Packed': 'Pending',
            'In Scan at Transit Hub': 'In Transit',
            'Out Scan at Transit Hub': 'In Transit to Agency',
            'In Scan at Local Agency': 'Arrived at Agency',
            'Out for Delivery': 'Out for Delivery',
            'Delivered': 'Delivered',
            'Failed': 'Failed',
            'RTO': 'RTO'
        };
        return map[raw] || raw;
    }

    async lookupAgentName(agencyId: string, agentId: string): Promise<string> {
        const agents = await this.readJson(this.agentsPath);
        const agent = (agents[agencyId] || []).find((a: any) => a.id === agentId);
        return agent?.name || 'Unknown Agent';
    }

    async getAgencyDeliveries(agencyId: string) {
        const agState = await this.readJson(this.agencyShipmentsPath);
        const rawDeliveries = (agState[agencyId]?.deliveries || []).filter((d: any) =>
            d.status === 'Out for Delivery' || d.status === 'Failed'
        );
        return await Promise.all(rawDeliveries.map(async (d: any) => ({
            ...d,
            agentName: d.agentId ? await this.lookupAgentName(agencyId, d.agentId) : 'Unknown'
        })));
    }

    async recordDeliveryAttempt(agencyId: string, trackingId: string, failStatus: string, notes: string) {
        const agState = await this.readJson(this.agencyShipmentsPath);
        const deliveries: any[] = agState[agencyId]?.deliveries || [];
        let delivery = deliveries.find((d: any) => d.trackingId === trackingId);
        if (!delivery) return { status: 'error', flagMsg: 'Delivery entry not found.' };

        delivery.attemptCount = (delivery.attemptCount || 0) + 1;
        delivery.notes = notes || delivery.notes;

        const shipData = await this.readJson(this.shipmentsPath);
        const shipment = shipData.shipments.find((s: any) => s.trackingId === trackingId);
        if (shipment) {
            shipment.attemptCount = delivery.attemptCount;
        }

        const config = await this.readJson(this.configPath).catch(() => ({ maxRtoAttempts: 3 }));
        const maxAttempts = config.maxRtoAttempts || 3;

        if (delivery.attemptCount >= maxAttempts) {
            delivery.status = 'RTO';
            if (shipment) shipment.status = 'RTO';
            if (!agState[agencyId].rto) agState[agencyId].rto = [];
            const resolvedAgentName = delivery.agentId
                ? await this.lookupAgentName(agencyId, delivery.agentId)
                : 'Unknown';
            agState[agencyId].rto.push({
                id: `RTO-${Date.now()}`,
                trackingId,
                customerName: delivery.customerName,
                agentId: delivery.agentId,
                agentName: resolvedAgentName,
                reason: `${failStatus} — exceeded ${maxAttempts} delivery attempts`,
                status: 'In Transit',
                date: new Date().toISOString().split('T')[0]
            });
        } else {
            delivery.status = 'Failed';
            if (shipment) shipment.status = 'Failed';
        }
        if (shipment) { if (!shipment.updatedAt) shipment.updatedAt = []; shipment.updatedAt.push(new Date().toISOString()); }

        await this.writeJson(this.agencyShipmentsPath, agState);
        await this.writeJson(this.shipmentsPath, shipData);
        return { status: 'success', delivery, autoRTO: delivery.attemptCount >= maxAttempts };
    }

    async markDelivered(agencyId: string, trackingId: string) {
        const agState = await this.readJson(this.agencyShipmentsPath);
        const delivery = (agState[agencyId]?.deliveries || []).find((d: any) => d.trackingId === trackingId);
        if (!delivery) return { status: 'error', flagMsg: 'Delivery entry not found.' };
        delivery.status = 'Delivered';

        const shipData = await this.readJson(this.shipmentsPath);
        const shipment = shipData.shipments.find((s: any) => s.trackingId === trackingId);
        if (shipment) { shipment.status = 'Delivered'; if (!shipment.updatedAt) shipment.updatedAt = []; shipment.updatedAt.push(new Date().toISOString()); }

        await this.writeJson(this.agencyShipmentsPath, agState);
        await this.writeJson(this.shipmentsPath, shipData);
        return { status: 'success', delivery };
    }

    async getAgencyRTO(agencyId: string) {
        const agState = await this.readJson(this.agencyShipmentsPath);
        const rtoList = agState[agencyId]?.rto || [];
        return await Promise.all(rtoList.map(async (r: any) => ({
            ...r,
            agentName: r.agentId ? await this.lookupAgentName(agencyId, r.agentId) : (r.agentName || 'Unknown')
        })));
    }

    async createRTO(agencyId: string, rtoData: any) {
        const agState = await this.readJson(this.agencyShipmentsPath);
        if (!agState[agencyId]) agState[agencyId] = { agentAssignments: {}, deliveries: [], rto: [] };
        if (!agState[agencyId].rto) agState[agencyId].rto = [];
        const entry = { id: `RTO-${Date.now()}`, ...rtoData, status: 'In Transit', date: new Date().toISOString().split('T')[0] };
        agState[agencyId].rto.push(entry);

        const deliveries: any[] = agState[agencyId]?.deliveries || [];
        const delivery = deliveries.find((d: any) => d.trackingId === rtoData.trackingId);
        if (delivery) delivery.status = 'RTO';

        const shipData = await this.readJson(this.shipmentsPath);
        const shipment = shipData.shipments.find((s: any) => s.trackingId === rtoData.trackingId);
        if (shipment) { shipment.status = 'RTO'; if (!shipment.updatedAt) shipment.updatedAt = []; shipment.updatedAt.push(new Date().toISOString()); }

        await this.writeJson(this.agencyShipmentsPath, agState);
        await this.writeJson(this.shipmentsPath, shipData);
        return { status: 'success', rto: entry };
    }
}
