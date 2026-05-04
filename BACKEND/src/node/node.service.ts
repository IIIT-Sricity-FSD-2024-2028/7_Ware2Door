import { Injectable } from '@nestjs/common';
import { NodeRepository } from './node.repository';

@Injectable()
export class NodeService {

    constructor(public noderepo: NodeRepository) {}

    async ValidateCredentials(mail: string, pass: string, type: any) {
        const data = await this.noderepo.getMailPassword(type);
        for (const user of data) {
            if (user.email === mail) {
                if (user.isActive === false) {
                    return { status: 'error', message: 'Account is suspended. Please contact Super User.' };
                }
                if (user.password === pass) return { status: 'success', message: user };
                return { status: 'error', message: 'Incorrect password' };
            }
        }
        return { status: 'error', message: 'Email not found' };
    }

    async verifyEmail(email: string) {
        return this.noderepo.checkEmailExists(email);
    }

    async resetPassword(email: string, newPass: string) {
        return this.noderepo.resetPasswordWithEmail(email, newPass);
    }

    async getCurrentStock(id: string) { return this.noderepo.fetchAllInventory(id); }
    addItem(label_id: string, label_name: string, quantity: number, id: string) { return this.noderepo.setItem(label_id, label_name, quantity, id); }
    async getPendingShipments(warehouseId: string) { return this.noderepo.getPendingShipments(warehouseId); }

    async addPendingShipment(warehouseId: string, body: any) {
        const shipment = { orderId: body.orderId, source: body.source, customerName: body.customerName, customerPhone: body.customerPhone, customerAddress: body.customerAddress, productName: body.productName, sku: body.sku || '', qty: body.qty, priority: body.priority || 'normal', receivedAt: new Date().toISOString() };
        return this.noderepo.addPendingShipment(warehouseId, shipment);
    }

    async deletePendingShipment(warehouseId: string, orderId: string) { return this.noderepo.removePendingShipment(warehouseId, orderId); }

    async getHubInventory(hubId: string) {
        const shipments = await this.noderepo.getHubInventory(hubId);
        const enriched = [];
        for (const s of shipments) {
            const driverInfo = await this.noderepo.getDriverInfo(`${s.warehouseId}_${s.hubId}`);
            const agencyName = await this.noderepo.getAgencyName(s.agencyId);
            const hubInfo = await this.noderepo.getHubInfo(hubId);
            const warehouseName = await this.noderepo.getWarehouseName(s.warehouseId);
            enriched.push({ trackingId: s.trackingId, productName: s.productName, warehouseId: s.warehouseId, warehouseName, agencyId: s.agencyId, agencyName, hubName: hubInfo.name, driverName: driverInfo.name, vehicleNo: driverInfo.vehicle, inscanTime: s.updatedAt?.length ? s.updatedAt[s.updatedAt.length - 1] : new Date().toISOString() });
        }
        return enriched;
    }

    async getHubCapacity(hubId: string) { return this.noderepo.getHubCapacity(hubId); }

    async getAgencyShipments(agencyId: string) { return this.noderepo.getAgencyShipments(agencyId); }
    async getAgencyDeliveries(agencyId: string) { return this.noderepo.getAgencyDeliveries(agencyId); }
    async recordDeliveryAttempt(agencyId: string, trackingId: string, failStatus: string, notes: string) { return this.noderepo.recordDeliveryAttempt(agencyId, trackingId, failStatus, notes); }
    async markDelivered(agencyId: string, trackingId: string) { return this.noderepo.markDelivered(agencyId, trackingId); }
    async getAgencyRTO(agencyId: string) { return this.noderepo.getAgencyRTO(agencyId); }
    async createRTO(agencyId: string, rtoData: any) { return this.noderepo.createRTO(agencyId, rtoData); }
}
