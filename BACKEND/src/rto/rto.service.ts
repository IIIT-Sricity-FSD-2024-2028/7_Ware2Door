import { Injectable } from '@nestjs/common';
import { RtoRepository } from './rto.repository';

@Injectable()
export class RtoService {
    constructor(private readonly rtoRepo: RtoRepository) {}

    async createRto(agencyId: string, data: any) {
        return this.rtoRepo.createRto(agencyId, data);
    }

    async getAgencyRtos(agencyId: string) {
        return this.rtoRepo.getAgencyRtos(agencyId);
    }

    async getAllRtos(warehouseId?: string) {
        return this.rtoRepo.getAllRtos(warehouseId);
    }

    async getRtoById(rtoId: string) {
        return this.rtoRepo.getRtoById(rtoId);
    }

    async hubInscan(hubId: string, rtoId: string) {
        return this.rtoRepo.hubInscan(hubId, rtoId);
    }

    async hubOutscan(hubId: string, rtoId: string) {
        return this.rtoRepo.hubOutscan(hubId, rtoId);
    }

    async warehouseInscan(rtoId: string) {
        return this.rtoRepo.warehouseInscan(rtoId);
    }
}
