import { Injectable } from '@nestjs/common';
import { ShipmentsRepository } from './shipments.repository';
import { NodeRepository } from '../node/node.repository';
import { randomBytes } from 'crypto';

@Injectable()
export class ShipmentsService {
    constructor(
        public shipmentrepo: ShipmentsRepository,
        private nodeRepo: NodeRepository
    ) {}

    async getManifestForWarehouse(id: string) {
        return this.shipmentrepo.getManifestForWarehouse(id);
    }

    async dispatchShipment(warehouseId: string, orderId: string, hubId: string, agencyId: string) {
        const pendingList = await this.nodeRepo.getPendingShipments(warehouseId);
        const order = pendingList.find((s: any) => s.orderId === orderId);
        if (!order) return { success: false, error: 'Order not found in pending shipments' };

        const inv = await this.nodeRepo.fetchAllInventory(warehouseId);
        const item = inv.find((i: any) => i.itemName === order.productName);
        if (!item || item.quantity < order.qty) return { success: false, error: 'Insufficient stock' };

        await this.nodeRepo.setItem(item.labelId, item.itemName, -order.qty, warehouseId);
        await this.nodeRepo.removePendingShipment(warehouseId, orderId);

        const trackingId = 'W2D' + randomBytes(4).toString('hex').toUpperCase();

        const ts = new Date().toISOString();
        const shipment = {
            trackingId,
            orderId,
            warehouseId,
            hubId,
            agencyId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerAddress: order.customerAddress,
            productName: order.productName,
            sku: order.sku || '',
            qty: order.qty,
            priority: order.priority || 'normal',
            status: 'Picked and Packed',
            createdAt: ts,
            updatedAt: [ts]
        };

        const result = await this.shipmentrepo.createShipment(shipment);
        return { success: true, trackingId, status: 'Picked and Packed' };
    }

    async getSummary(warehouseId: string) {
        return this.shipmentrepo.getSummary(warehouseId);
    }
}
