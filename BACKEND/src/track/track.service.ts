import { Injectable } from '@nestjs/common';
import { ShipmentsService } from '../shipments/shipments.service';
import { NodeRepository } from '../node/node.repository';
import { RtoService } from '../rto/rto.service';

const STATUS_STEPS = [
    { label: 'Order Received',                    icon: 'check'    },
    { label: 'Picked and Packed',                 icon: 'box'      },
    { label: 'Shipment Dispatched',               icon: 'truck'    },
    { label: 'In Scan at Transit Hub',            icon: 'location' },
    { label: 'Outscan at Transit Hub',            icon: 'truck'    },
    { label: 'In Scan at Local Delivery Agency',  icon: 'location' },
    { label: 'Out for Delivery',                  icon: 'van'      },
    { label: 'Delivered',                         icon: 'home'     },
];

const STATUS_INDEX: Record<string, number> = {
    'Picked and Packed':         2,
    'In Scan at Transit Hub':    3,
    'Out Scan at Transit Hub':   4,
    'In Scan at Local Agency':   5,
    'Out for Delivery':          6,
    'Failed':                    6,
    'RTO':                       6,
    'Delivered':                 7,
};

const RTO_STATUS_STEPS = [
    { label: 'RTO Initiated',               icon: 'ban',      desc: 'Package could not be delivered and has been flagged for return.' },
    { label: 'RTO At Hub',                  icon: 'location', desc: 'Package arrived at the transit hub and is being processed.' },
    { label: 'RTO In Transit to Warehouse', icon: 'truck',    desc: 'Package is on its way back to the origin warehouse.' },
    { label: 'Returned to Warehouse',       icon: 'home',     desc: 'Package successfully returned. For prepaid orders, your refund will be credited within 5–7 business working days.', refundNote: true },
];

const RTO_STATUS_INDEX: Record<string, number> = {
    'RTO Initiated':               0,
    'RTO At Hub':                  1,
    'RTO In Transit to Warehouse': 2,
    'Returned to Warehouse':       3,
    'RTO':                         0,
    'RTO Dispatched':              0,
};

function resolveTimestamp(stepIdx: number, createdAt: string, updatedAt: string[]): string | null {
    if (stepIdx === 0) return createdAt;
    if (stepIdx === 1 || stepIdx === 2) return updatedAt[0] || null;
    return updatedAt[stepIdx - 2] || null;
}

@Injectable()
export class TrackService {
    constructor(
        private readonly shipmentsService: ShipmentsService,
        private readonly nodeRepo: NodeRepository,
        private readonly rtoService: RtoService,
    ) {}

    async getTrackingDetails(id: string) {
        if (id.startsWith('RTOID-')) {
            return this.getRtoTrackingDetails(id);
        }

        const all      = await this.shipmentsService.shipmentrepo.getAllShipments();
        const shipment = all.find((s: any) => s.trackingId === id);

        if (shipment && ['RTO', 'RTO Initiated', 'RTO At Hub', 'RTO In Transit to Warehouse', 'Returned to Warehouse'].includes(shipment.status)) {
            const rtos = await this.rtoService.getAllRtos();
            const rto  = (rtos as any[]).find((r: any) => r.trackingId === id);
            if (rto) return this.getRtoTrackingDetails(rto.rtoId);
        }

        if (!shipment) {
            const rtos = await this.rtoService.getAllRtos();
            const rto  = (rtos as any[]).find((r: any) => r.trackingId === id);
            if (rto) return this.getRtoTrackingDetails(rto.rtoId);
            return null;
        }

        const currentIdx          = STATUS_INDEX[shipment.status] ?? 0;
        const updatedAt: string[] = Array.isArray(shipment.updatedAt) ? shipment.updatedAt : [];

        const statusSteps = STATUS_STEPS.map((step, i) => {
            const done    = i <= currentIdx;
            const current = i === currentIdx;
            const time    = resolveTimestamp(i, shipment.createdAt, updatedAt);
            return { label: step.label, icon: step.icon, done, current, time: done ? time : null };
        });

        let driverName = '—'; let vehicleNo = '—';
        try {
            if (currentIdx <= 3) { const d = await this.nodeRepo.getDriverInfo(`${shipment.warehouseId}_${shipment.hubId}`); driverName = d.name; vehicleNo = d.vehicle; }
            else { const d = await this.nodeRepo.getDriverInfo(`${shipment.hubId}_${shipment.agencyId}`); driverName = d.name; vehicleNo = d.vehicle; }
        } catch (_) {}

        let warehouseName = shipment.warehouseId, hubName = shipment.hubId, agencyName = shipment.agencyId;
        try {
            warehouseName = await this.nodeRepo.getWarehouseName(shipment.warehouseId);
            const h = await this.nodeRepo.getHubInfo(shipment.hubId);
            hubName = h.name;
            agencyName = await this.nodeRepo.getAgencyName(shipment.agencyId);
        } catch (_) {}

        return {
            trackingId: shipment.trackingId, productName: shipment.productName, status: shipment.status,
            warehouseId: shipment.warehouseId, warehouseName, hubId: shipment.hubId, hubName,
            agencyId: shipment.agencyId, agencyName, lat: shipment.lat, lng: shipment.lng,
            driverName, vehicleNo, history: updatedAt, statusSteps,
        };
    }

    private async getRtoTrackingDetails(rtoId: string) {
        const rto = await this.rtoService.getRtoById(rtoId);
        if (!rto) return null;

        const currentIdx          = RTO_STATUS_INDEX[rto.status] ?? 0;
        const updatedAt: string[] = Array.isArray(rto.updatedAt) ? rto.updatedAt : [];

        const statusSteps = RTO_STATUS_STEPS.map((step, i) => ({
            label:      step.label,
            icon:       step.icon,
            desc:       step.desc,
            refundNote: (step as any).refundNote || false,
            done:       i <= currentIdx,
            current:    i === currentIdx,
            time:       i === 0 ? rto.createdAt : (updatedAt[i - 1] || null),
        }));

        const allShipments       = await this.shipmentsService.shipmentrepo.getAllShipments();
        const underlyingShipment = allShipments.find((s: any) => s.trackingId === rto.trackingId);

        return {
            trackingId:  rto.trackingId,
            rtoId:       rto.rtoId,
            isRTO:       true,
            productName: rto.productName,
            status:      rto.status,
            reason:      rto.reason,
            customerName: rto.customerName,
            warehouseId: rto.warehouseId,
            hubId:       rto.hubId,
            lat:         underlyingShipment?.lat || null,
            lng:         underlyingShipment?.lng || null,
            driverName:  '—',
            vehicleNo:   '—',
            history:     updatedAt,
            statusSteps,
        };
    }
}
