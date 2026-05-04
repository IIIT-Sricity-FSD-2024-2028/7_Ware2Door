import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ShipmentsRepository {
    private filePath = join(__dirname, 'shipments.json');
    private nodeDataPath = join(__dirname, '..', 'node', 'data.json');

    private async readJson(path: string) {
        const c = await readFile(path, 'utf-8').catch(() => '{}');
        return JSON.parse(c);
    }

    private async writeJson(path: string, data: any) {
        await writeFile(path, JSON.stringify(data, null, 2));
    }

    async getManifestForWarehouse(warehouseId: string) {
        const data = await this.readJson(this.filePath);
        return (data.shipments || []).filter((s: any) => s.warehouseId === warehouseId);
    }

    async getAllShipments() {
        const data = await this.readJson(this.filePath);
        return data.shipments || [];
    }

    async createShipment(shipment: any) {
        const data = await this.readJson(this.filePath);
        if (!data.shipments) data.shipments = [];
        data.shipments.unshift(shipment);
        await this.writeJson(this.filePath, data);
        return shipment;
    }

    async getSummary(warehouseId: string) {
        const data = await this.readJson(this.filePath);
        const ships = (data.shipments || []).filter((s: any) => s.warehouseId === warehouseId);
        return {
            totalDispatched: ships.length,
            inTransit: ships.filter((s: any) => s.status === 'Picked and Packed' || s.status === 'In Scan at Transit Hub' || s.status === 'Out Scan at Transit Hub').length,
            delivered: ships.filter((s: any) => s.status === 'Delivered').length,
            rto: ships.filter((s: any) => s.status === 'RTO').length
        };
    }
}