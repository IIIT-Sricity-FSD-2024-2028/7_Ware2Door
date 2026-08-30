import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
    constructor(private reportsRepo: ReportsRepository) {}

    async getInboundForHub(hubId: string) {
        const allShipments = await this.reportsRepo.getShipments();
        const inbound = [];
        for (const s of allShipments) {
            if (s.hubId === hubId && s.status === 'Picked and Packed') {
                const driverInfo = await this.reportsRepo.getDriverInfo(`${s.warehouseId}_${s.hubId}`);
                const agencyName = await this.reportsRepo.getAgencyName(s.agencyId);
                inbound.push({ ...s, driverName: driverInfo.name, vehicleNo: driverInfo.vehicle, agencyName });
            }
        }
        return inbound;
    }

    async getOutboundForHub(hubId: string) {
        const allShipments = await this.reportsRepo.getShipments();
        const shipments = allShipments.filter((s: any) => s.hubId === hubId && s.status === 'Out Scan at Transit Hub');
        const enriched = [];
        for (const s of shipments) {
            const driverInfo = await this.reportsRepo.getDriverInfo(`${s.hubId}_${s.agencyId}`);
            const agencyName = await this.reportsRepo.getAgencyName(s.agencyId);
            const warehouseName = await this.reportsRepo.getWarehouseName(s.warehouseId);
            enriched.push({ ...s, warehouseName, driverName: driverInfo.name, vehicleNo: driverInfo.vehicle, agencyName });
        }
        return enriched;
    }

    async getAgencyInbound(agencyId: string) {
        const allShipments = await this.reportsRepo.getShipments();
        const agState = await this.reportsRepo.getAgencyShipmentsState();
        const assignments: any = agState[agencyId]?.agentAssignments || {};
        
        const inbound = allShipments.filter((s: any) =>
            s.agencyId === agencyId &&
            (s.status === 'Out Scan at Transit Hub' || s.status === 'In Scan at Local Agency')
        );
        
        const result = [];
        for (const s of inbound) {
            const hubInfo = await this.reportsRepo.getHubInfo(s.hubId);
            const assignment = assignments[s.trackingId];
            const agentName = assignment?.agentId
                ? await this.reportsRepo.lookupAgentName(agencyId, assignment.agentId)
                : null;
            result.push({
                trackingId: s.trackingId,
                productName: s.productName,
                hubName: hubInfo.name,
                customerName: s.customerName,
                status: s.status,
                scanStatus: s.status === 'In Scan at Local Agency' ? 'in-scan' : 'pending',
                assignedAgentId: assignment?.agentId || null,
                assignedAgentName: agentName,
                updatedAt: s.updatedAt
            });
        }
        return result;
    }

    async getOutboundShipments(id: string) {
        const shipments = await this.reportsRepo.getShipments();
        const outbound = [];
        for (let shipment of shipments) {
            if (shipment.warehouseId == id && shipment.status == 'Picked and Packed') {
                const driverInfo = await this.reportsRepo.getDriverInfo(`${shipment.warehouseId}_${shipment.hubId}`);
                const hubInfo = await this.reportsRepo.getHubInfo(shipment.hubId);
                const agencyName = await this.reportsRepo.getAgencyName(shipment.agencyId);
                outbound.push({
                    ...shipment,
                    driverName: driverInfo.name,
                    vehicleNo: driverInfo.vehicle,
                    hubName: hubInfo.name,
                    hubAddress: hubInfo.address,
                    agencyName: agencyName
                });
            }
        }
        return outbound;
    }

    async getPreAlertReport(id: string) {
        const shipments = await this.getOutboundShipments(id);
        const total_out_scanned = shipments.length;
        const hubMap: any = {};
        for (let shipment of shipments) {
            if (!hubMap[shipment.hubId]) {
                hubMap[shipment.hubId] = {
                    hubId: shipment.hubId,
                    hubName: shipment.hubName,
                    hubAddress: shipment.hubAddress,
                    shipments: [],
                    count: 0,
                    driverName: shipment.driverName,
                    vehicleNo: shipment.vehicleNo
                };
            }
            hubMap[shipment.hubId].shipments.push(shipment);
            hubMap[shipment.hubId].count++;
        }
        const active_hubs = Object.keys(hubMap).length;
        const hubs = Object.values(hubMap);
        return { total_out_scanned, active_hubs, hubs };
    }
}
