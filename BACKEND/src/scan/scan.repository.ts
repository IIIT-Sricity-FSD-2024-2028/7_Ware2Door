import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ScanRepository {
    private hubScanHistoryPath    = join(__dirname, 'hub-scan-history.json');
    private agencyScanHistoryPath = join(__dirname, 'agency-scan-history.json');
    private shipmentsPath         = join(__dirname, '..', 'shipments', 'shipments.json');
    private dataPath              = join(__dirname, '..', 'node', 'data.json');
    private agencyShipmentsPath   = join(__dirname, '..', 'node', 'agency-shipments.json');
    private agentsPath            = join(__dirname, '..', 'workers', 'agents.json');
    private driversPath           = join(__dirname, '..', 'workers', 'drivers.json');

    private async readJson(path: string) {
        const c = await readFile(path, 'utf-8').catch(() => '{}');
        return JSON.parse(c);
    }

    private async writeJson(path: string, data: any) {
        await writeFile(path, JSON.stringify(data, null, 2));
    }

    async getShipmentByTracking(trackingId: string) {
        const data = await this.readJson(this.shipmentsPath);
        return data.shipments.find((s: any) => s.trackingId === trackingId) || null;
    }

    async getHubInfo(hubId: string) {
        const data = await this.readJson(this.dataPath);
        const hub = (data['TRANSIT_HUB'] || []).find((h: any) => h.id === hubId);
        return hub ? { name: hub.name, address: hub.address + ', ' + hub.city, lat: hub.lat || null, lng: hub.lng || null } : { name: hubId, address: '', lat: null, lng: null };
    }

    async getHubName(hubId: string) { return (await this.getHubInfo(hubId)).name; }

    async getAgencyInfo(agencyId: string) {
        const data = await this.readJson(this.dataPath);
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

    async getDriverInfo(driverId: string) {
        const drivers = await this.readJson(this.driversPath);
        return drivers[driverId] || { name: 'Unregistered Driver', vehicle: 'N/A' };
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

    async getScanHistory(hubId: string) {
        const data     = await this.readJson(this.hubScanHistoryPath);
        const history  = data[hubId] || [];
        const shipData = await this.readJson(this.shipmentsPath);
        return history.filter((record: any) => {
            if (record.flagged) return true;
            if (record.isRTO)   return true;
            const s = shipData.shipments.find((ship: any) => ship.trackingId === record.trackingId);
            if (!s) return false;
            if (record.status === 'Outscan')    return ['Out Scan at Transit Hub', 'Delivered'].includes(s.status);
            if (record.status === 'Scanned In') return ['In Scan at Transit Hub', 'Out Scan at Transit Hub', 'Delivered'].includes(s.status);
            return true;
        });
    }

    async addScanRecord(hubId: string, record: any) {
        const data = await this.readJson(this.hubScanHistoryPath);
        if (!data[hubId]) data[hubId] = [];
        data[hubId].unshift(record);
        await this.writeJson(this.hubScanHistoryPath, data);
        return record;
    }

    async updateScanRecord(hubId: string, trackingId: string, updates: any) {
        const data = await this.readJson(this.hubScanHistoryPath);
        if (!data[hubId]) return null;
        const record = data[hubId].find((r: any) => r.trackingId === trackingId && r.status === 'Scanned In');
        if (!record) return null;
        Object.assign(record, updates);
        await this.writeJson(this.hubScanHistoryPath, data);
        return record;
    }

    async agencyInscan(agencyId: string, trackingId: string) {
        const shipData = await this.readJson(this.shipmentsPath);
        const shipment = shipData.shipments.find((s: any) => s.trackingId === trackingId);
        const ts       = new Date().toISOString();
        const record: any = { trackingId, scannedAt: ts };

        if (!shipment) {
            record.status = 'Error'; record.flagged = true; record.flagMsg = 'invalid tracking id';
            await this.addAgencyScanRecord(agencyId, record);
            return { status: 'error', flagged: true, flagMsg: record.flagMsg };
        }
        if (shipment.agencyId !== agencyId) {
            record.status = 'Error'; record.flagged = true; record.flagMsg = 'wrong node came';
            await this.addAgencyScanRecord(agencyId, record);
            return { status: 'error', flagged: true, flagMsg: record.flagMsg };
        }
        if (shipment.status === 'In Scan at Local Agency') {
            return { status: 'error', flagged: false, flagMsg: 'Already scanned in at this agency' };
        }
        if (shipment.status !== 'Out Scan at Transit Hub') {
            return { status: 'error', flagged: false, flagMsg: 'not outscanned' };
        }

        shipment.status = 'In Scan at Local Agency';
        if (!shipment.updatedAt) shipment.updatedAt = [];
        shipment.updatedAt.push(ts);

        const agencyLatLng = await this.getAgencyLatLng(agencyId);
        if (agencyLatLng.lat) { shipment.lat = agencyLatLng.lat; shipment.lng = agencyLatLng.lng; }

        await this.writeJson(this.shipmentsPath, shipData);

        record.status      = 'Scanned In';
        record.flagged     = false;
        record.flagMsg     = '';
        record.productName = shipment.productName;
        await this.addAgencyScanRecord(agencyId, record);
        return { status: 'success', shipment };
    }

    async agencyOutscan(agencyId: string, trackingId: string) {
        const shipData = await this.readJson(this.shipmentsPath);
        const agState  = await this.readJson(this.agencyShipmentsPath);
        const shipment = shipData.shipments.find((s: any) => s.trackingId === trackingId);

        if (!shipment || shipment.status !== 'In Scan at Local Agency' || shipment.agencyId !== agencyId)
            return { status: 'error', flagMsg: 'Shipment not found or not inscanned at this agency.' };

        const assignment = agState[agencyId]?.agentAssignments?.[trackingId];
        if (!assignment) return { status: 'error', flagMsg: 'Assign a delivery agent before out-scanning.' };

        const ts = new Date().toISOString();
        shipment.status = 'Out for Delivery';
        if (!shipment.updatedAt) shipment.updatedAt = [];
        shipment.updatedAt.push(ts);
        await this.writeJson(this.shipmentsPath, shipData);

        if (!agState[agencyId].deliveries) agState[agencyId].deliveries = [];
        const existing = agState[agencyId].deliveries.find((d: any) => d.trackingId === trackingId);
        if (!existing) {
            agState[agencyId].deliveries.push({
                trackingId,
                agentId: assignment.agentId,
                customerName: shipment.customerName,
                customerAddress: shipment.customerAddress,
                status: 'Out for Delivery',
                attemptCount: 0,
                notes: '',
                createdAt: ts
            });
        }

        const agents = await this.readJson(this.agentsPath);
        if (agents[agencyId]) {
            const agent = agents[agencyId].find((a: any) => a.id === assignment.agentId);
            if (agent) {
                agent.assigned = (agent.assigned || 0) + 1;
                if (agent.status === 'Active' && agent.assigned >= 10) agent.status = 'Busy';
                await this.writeJson(this.agentsPath, agents);
            }
        }

        await this.writeJson(this.agencyShipmentsPath, agState);
        return { status: 'success', trackingId, agentName: assignment.agentName };
    }

    async getAgencyScanHistory(agencyId: string) {
        const data = await this.readJson(this.agencyScanHistoryPath);
        return data[agencyId] || [];
    }

    async addAgencyScanRecord(agencyId: string, record: any) {
        const data = await this.readJson(this.agencyScanHistoryPath);
        if (!data[agencyId]) data[agencyId] = [];
        data[agencyId].unshift(record);
        await this.writeJson(this.agencyScanHistoryPath, data);
        return record;
    }
}
