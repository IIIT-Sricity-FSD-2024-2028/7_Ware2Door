import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ReportsRepository {
    private shipmentsPath = join(__dirname, '..', 'shipments', 'shipments.json');
    private agencyShipmentsPath = join(__dirname, '..', 'node', 'agency-shipments.json');
    private dataPath = join(__dirname, '..', 'node', 'data.json');
    private agentsPath = join(__dirname, '..', 'workers', 'agents.json');
    private driversPath = join(__dirname, '..', 'workers', 'drivers.json');

    private async readJson(path: string) {
        const c = await readFile(path, 'utf-8').catch(() => '{}');
        return JSON.parse(c);
    }

    async getShipments() {
        const data = await this.readJson(this.shipmentsPath);
        return data.shipments || [];
    }

    async getAgencyShipmentsState() {
        return this.readJson(this.agencyShipmentsPath);
    }

    async getDriverInfo(driverId: string) {
        const drivers = await this.readJson(this.driversPath);
        return drivers[driverId] || { name: 'Unregistered Driver', vehicle: 'N/A' };
    }

    async getHubInfo(hubId: string) {
        const data = await this.readJson(this.dataPath);
        const hub = (data['TRANSIT_HUB'] || []).find((h: any) => h.id === hubId);
        return hub ? { name: hub.name, address: hub.address + ', ' + hub.city, lat: hub.lat || null, lng: hub.lng || null } : { name: hubId, address: '', lat: null, lng: null };
    }

    async getAgencyInfo(agencyId: string) {
        const data = await this.readJson(this.dataPath);
        return (data['LOCAL_AGENCY'] || []).find((a: any) => a.id === agencyId) || null;
    }

    async getAgencyName(agencyId: string) {
        const info = await this.getAgencyInfo(agencyId);
        return info ? info.name : agencyId;
    }

    async getWarehouseName(warehouseId: string) {
        const data = await this.readJson(this.dataPath);
        const wh = (data['WAREHOUSE'] || []).find((w: any) => w.id === warehouseId);
        return wh ? wh.name : warehouseId;
    }

    async lookupAgentName(agencyId: string, agentId: string): Promise<string> {
        const agents = await this.readJson(this.agentsPath);
        const agent = (agents[agencyId] || []).find((a: any) => a.id === agentId);
        return agent?.name || 'Unknown Agent';
    }
}
