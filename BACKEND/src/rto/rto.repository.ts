import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class RtoRepository {
    private rtoPath           = join(__dirname, 'rto.json');
    private shipmentsPath     = join(__dirname, '..', 'shipments', 'shipments.json');
    private warehouseStockPath = join(__dirname, '..', 'node', 'warehouse-stock.json');
    private dataPath          = join(__dirname, '..', 'node', 'data.json');

    private async readJson(path: string) {
        const c = await readFile(path, 'utf-8').catch(() => '[]');
        try { return JSON.parse(c); } catch { return []; }
    }

    private async writeJson(path: string, data: any) {
        await writeFile(path, JSON.stringify(data, null, 2));
    }

    private generateRtoId(): string {
        const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `RTOID-${Date.now()}-${num}`;
    }

    private async getHubName(hubId: string): Promise<string> {
        const data = await this.readJson(this.dataPath);
        const hub = (data['TRANSIT_HUB'] || []).find((h: any) => h.id === hubId);
        return hub ? hub.name : hubId;
    }

    private async getFacilityInfo(type: string, id: string): Promise<any> {
        const data = await this.readJson(this.dataPath);
        return (data[type] || []).find((f: any) => f.id === id) || null;
    }

    async createRto(agencyId: string, data: any) {
        const rtos: any[]  = await this.readJson(this.rtoPath);
        const shipData     = await this.readJson(this.shipmentsPath);
        const shipment     = shipData.shipments?.find((s: any) => s.trackingId === data.trackingId);
        const rtoId        = this.generateRtoId();
        const ts           = new Date().toISOString();
        const entry: any   = {
            rtoId,
            trackingId:    data.trackingId,
            agencyId,
            warehouseId:   shipment?.warehouseId || null,
            hubId:         shipment?.hubId || null,
            productName:   shipment?.productName || null,
            customerName:  data.customerName || shipment?.customerName || null,
            customerPhone: shipment?.customerPhone || null,
            agentId:       data.agentId || null,
            agentName:     data.agentName || null,
            reason:        data.reason,
            status:        'RTO Initiated',
            date:          new Date().toLocaleDateString('en-IN'),
            createdAt:     ts,
            updatedAt:     [],
        };
        rtos.push(entry);
        await this.writeJson(this.rtoPath, rtos);

        if (shipment) {
            shipment.status = 'RTO';
            if (!shipment.updatedAt) shipment.updatedAt = [];
            shipment.updatedAt.push(ts);
            const agencyInfo = await this.getFacilityInfo('LOCAL_AGENCY', agencyId);
            if (agencyInfo && agencyInfo.lat) {
                shipment.lat = agencyInfo.lat;
                shipment.lng = agencyInfo.lng;
            }
            await this.writeJson(this.shipmentsPath, { ...shipData });
        }

        try {
            const agencyShipmentsPath = join(__dirname, '..', 'node', 'agency-shipments.json');
            const agState = await this.readJson(agencyShipmentsPath);
            if (agState[agencyId] && agState[agencyId].deliveries) {
                const delivery = agState[agencyId].deliveries.find((d: any) => d.trackingId === data.trackingId);
                if (delivery) {
                    delivery.status = 'RTO';
                    await this.writeJson(agencyShipmentsPath, agState);
                }
            }
        } catch (e) {
            console.error('Failed to update agency-shipments.json for RTO', e);
        }

        return { status: 'success', rtoId, rto: entry };
    }

    async getAllRtos(warehouseId?: string) {
        const rtos: any[] = await this.readJson(this.rtoPath);
        if (warehouseId) return rtos.filter((r: any) => r.warehouseId === warehouseId);
        return rtos;
    }

    async getRtoById(rtoId: string) {
        const rtos: any[] = await this.readJson(this.rtoPath);
        return rtos.find((r: any) => r.rtoId === rtoId) || null;
    }

    async getAgencyRtos(agencyId: string) {
        const rtos: any[] = await this.readJson(this.rtoPath);
        return rtos.filter((r: any) => r.agencyId === agencyId);
    }

    async hubInscan(hubId: string, rtoId: string) {
        const rtos: any[] = await this.readJson(this.rtoPath);
        const rto = rtos.find((r: any) => r.rtoId === rtoId);

        if (!rto) return { status: 'error', flagged: true, flagMsg: 'RTO ID not found in system' };

        if (rto.hubId && rto.hubId !== hubId) {
            const correctHubName = await this.getHubName(rto.hubId);
            return { status: 'error', flagged: true, flagMsg: `Wrong hub for RTO — should go to ${correctHubName}` };
        }
        if (rto.status === 'RTO At Hub') return { status: 'error', flagged: false, flagMsg: 'Already in-scanned at this hub' };
        if (['RTO In Transit to Warehouse', 'Returned to Warehouse'].includes(rto.status))
            return { status: 'error', flagged: false, flagMsg: 'RTO already processed beyond this hub' };

        const ts = new Date().toISOString();
        rto.status = 'RTO At Hub';
        rto.updatedAt.push(ts);
        await this.writeJson(this.rtoPath, rtos);

        const shipData = await this.readJson(this.shipmentsPath);
        const shipment = shipData.shipments?.find((s: any) => s.trackingId === rto.trackingId);
        if (shipment) {
            shipment.status = 'RTO At Hub';
            if (!shipment.updatedAt) shipment.updatedAt = [];
            shipment.updatedAt.push(ts);
            const hubInfo = await this.getFacilityInfo('TRANSIT_HUB', hubId);
            if (hubInfo && hubInfo.lat) {
                shipment.lat = hubInfo.lat;
                shipment.lng = hubInfo.lng;
            }
            await this.writeJson(this.shipmentsPath, shipData);
        }

        return { status: 'success', rto };
    }

    async hubOutscan(hubId: string, rtoId: string) {
        const rtos: any[] = await this.readJson(this.rtoPath);
        const rto = rtos.find((r: any) => r.rtoId === rtoId);

        if (!rto) return { status: 'error', flagMsg: 'RTO ID not found' };
        if (rto.hubId && rto.hubId !== hubId) return { status: 'error', flagMsg: 'This RTO does not belong to this hub' };
        if (rto.status !== 'RTO At Hub') return { status: 'error', flagMsg: 'RTO not yet in-scanned at this hub. Perform RTO in-scan first.' };

        const ts = new Date().toISOString();
        rto.status = 'RTO In Transit to Warehouse';
        rto.updatedAt.push(ts);
        await this.writeJson(this.rtoPath, rtos);

        const shipData = await this.readJson(this.shipmentsPath);
        const shipment = shipData.shipments?.find((s: any) => s.trackingId === rto.trackingId);
        if (shipment) {
            shipment.status = 'RTO In Transit to Warehouse';
            if (!shipment.updatedAt) shipment.updatedAt = [];
            shipment.updatedAt.push(ts);
            await this.writeJson(this.shipmentsPath, shipData);
        }

        return { status: 'success', rto };
    }

    async warehouseInscan(rtoId: string) {
        const rtos: any[] = await this.readJson(this.rtoPath);
        const rto = rtos.find((r: any) => r.rtoId === rtoId);

        if (!rto) return { status: 'error', flagMsg: 'RTO ID not found' };
        if (rto.status === 'Returned to Warehouse') return { status: 'error', flagMsg: 'Already received at warehouse' };

        const ts = new Date().toISOString();
        rto.status = 'Returned to Warehouse';
        rto.updatedAt.push(ts);
        await this.writeJson(this.rtoPath, rtos);

        let stockRestored = false;
        if (rto.warehouseId && rto.productName) {
            const stockData = await this.readJson(this.warehouseStockPath);
            if (!stockData[rto.warehouseId]) stockData[rto.warehouseId] = [];
            const item = stockData[rto.warehouseId].find((i: any) =>
                i.itemName.trim().toLowerCase() === rto.productName.trim().toLowerCase()
            );
            if (item) {
                item.quantity += 1;
                item.lastUpdated = ts;
            } else {
                const year = new Date().getFullYear();
                const rand = Math.floor(100000 + Math.random() * 900000);
                stockData[rto.warehouseId].push({
                    labelId:     `SHP-${year}-${rand}`,
                    itemName:    rto.productName,
                    quantity:    1,
                    lastUpdated: ts,
                });
            }
            await this.writeJson(this.warehouseStockPath, stockData);
            stockRestored = true;
        }

        const shipData = await this.readJson(this.shipmentsPath);
        const shipment = shipData.shipments?.find((s: any) => s.trackingId === rto.trackingId);
        if (shipment) {
            shipment.status = 'Returned to Warehouse';
            if (!shipment.updatedAt) shipment.updatedAt = [];
            shipment.updatedAt.push(ts);
            if (rto.warehouseId) {
                const whInfo = await this.getFacilityInfo('WAREHOUSE', rto.warehouseId);
                if (whInfo && whInfo.lat) {
                    shipment.lat = whInfo.lat;
                    shipment.lng = whInfo.lng;
                }
            }
            await this.writeJson(this.shipmentsPath, shipData);
        }

        return { status: 'success', rto, stockRestored };
    }
}
