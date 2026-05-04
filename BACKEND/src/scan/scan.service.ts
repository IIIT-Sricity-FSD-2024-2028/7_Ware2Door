import { Injectable } from '@nestjs/common';
import { ScanRepository } from './scan.repository';
import { RtoService } from '../rto/rto.service';

@Injectable()
export class ScanService {
    constructor(
        private scanRepo: ScanRepository,
        private rtoService: RtoService,
    ) {}

    async inscanAtHub(hubId: string, trackingId: string) {
        if (trackingId.startsWith('RTOID-')) {
            const result = await this.rtoService.hubInscan(hubId, trackingId);
            if (result.status === 'success') {
                await this.scanRepo.addScanRecord(hubId, {
                    trackingId,
                    status: 'Scanned In',
                    agencyName: `RTO Return — ${result.rto?.customerName || ''}`,
                    hubName: null,
                    warehouseId: result.rto?.warehouseId || null,
                    timestamp: new Date().toISOString(),
                    flagged: false,
                    flagMsg: '',
                    isRTO: true,
                });
            } else if (result.flagged) {
                await this.scanRepo.addScanRecord(hubId, {
                    trackingId,
                    status: 'Error',
                    agencyName: null,
                    timestamp: new Date().toISOString(),
                    flagged: true,
                    flagMsg: result.flagMsg,
                    isRTO: true,
                });
            }
            return result;
        }

        const shipment = await this.scanRepo.getShipmentByTracking(trackingId);
        if (!shipment) {
            await this.scanRepo.addScanRecord(hubId, { trackingId, status: 'Error', agencyName: null, timestamp: new Date().toISOString(), flagged: true, flagMsg: 'Unknown tracking ID — not found in manifest' });
            return { status: 'error', flagged: true, flagMsg: 'Unknown tracking ID — not found in manifest' };
        }
        if (shipment.hubId !== hubId) {
            const correctHubName = await this.scanRepo.getHubName(shipment.hubId);
            const agencyName = await this.scanRepo.getAgencyName(shipment.agencyId);
            await this.scanRepo.addScanRecord(hubId, { trackingId, status: 'Error', agencyName, timestamp: new Date().toISOString(), flagged: true, flagMsg: `Wrong hub — routed to ${correctHubName}` });
            return { status: 'error', flagged: true, flagMsg: `Wrong hub — routed to ${correctHubName}` };
        }
        if (shipment.status === 'In Scan at Transit Hub') return { status: 'error', flagged: false, flagMsg: 'Already in-scanned and in inventory' };
        if (shipment.status === 'Out Scan at Transit Hub') return { status: 'error', flagged: false, flagMsg: 'Already out-scanned and dispatched' };
        if (shipment.status !== 'Picked and Packed') return { status: 'error', flagged: false, flagMsg: `Invalid status: ${shipment.status}` };

        const agencyName = await this.scanRepo.getAgencyName(shipment.agencyId);
        const driverInfo = await this.scanRepo.getDriverInfo(`${shipment.warehouseId}_${shipment.hubId}`);
        const hubInfo    = await this.scanRepo.getHubInfo(shipment.hubId);

        await this.scanRepo.updateShipmentStatus(trackingId, 'In Scan at Transit Hub');
        if (hubInfo.lat) await this.scanRepo.updateShipmentLatLng(trackingId, hubInfo.lat, hubInfo.lng);

        const invEntry = { trackingId: shipment.trackingId, productName: shipment.productName, warehouseId: shipment.warehouseId, agencyId: shipment.agencyId, agencyName, hubName: hubInfo.name, driverName: driverInfo.name, vehicleNo: driverInfo.vehicle, inscanTime: new Date().toISOString() };
        await this.scanRepo.addScanRecord(hubId, { trackingId: shipment.trackingId, status: 'Scanned In', agencyName, hubName: hubInfo.name, warehouseId: shipment.warehouseId, timestamp: new Date().toISOString(), flagged: false, flagMsg: '' });
        return { status: 'success', shipment: invEntry };
    }

    async outscanFromHub(hubId: string, trackingId: string) {
        if (trackingId.startsWith('RTOID-')) {
            const result = await this.rtoService.hubOutscan(hubId, trackingId);
            if (result.status === 'success') {
                await this.scanRepo.updateScanRecord(hubId, trackingId, { status: 'Outscan', timestamp: new Date().toISOString() });
                return { status: 'success', shipment: { trackingId, agencyName: `RTO Return — Origin Warehouse`, outscanTime: new Date().toISOString() } };
            }
            return result;
        }

        const shipment = await this.scanRepo.getShipmentByTracking(trackingId);
        if (!shipment || shipment.status !== 'In Scan at Transit Hub' || shipment.hubId !== hubId)
            return { status: 'error', flagMsg: 'Shipment not found in hub inventory. Perform in-scan first.' };
        await this.scanRepo.updateShipmentStatus(trackingId, 'Out Scan at Transit Hub');
        await this.scanRepo.updateScanRecord(hubId, trackingId, { status: 'Outscan', timestamp: new Date().toISOString() });
        const agencyName = await this.scanRepo.getAgencyName(shipment.agencyId);
        return { status: 'success', shipment: { trackingId, agencyName, outscanTime: new Date().toISOString() } };
    }

    async getScanHistory(hubId: string) {
        return this.scanRepo.getScanHistory(hubId);
    }

    async agencyInscan(agencyId: string, trackingId: string) {
        return this.scanRepo.agencyInscan(agencyId, trackingId);
    }

    async agencyOutscan(agencyId: string, trackingId: string) {
        return this.scanRepo.agencyOutscan(agencyId, trackingId);
    }

    async getAgencyScanHistory(agencyId: string) {
        return this.scanRepo.getAgencyScanHistory(agencyId);
    }
}
