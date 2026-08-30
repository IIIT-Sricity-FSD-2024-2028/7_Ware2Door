import { Injectable } from '@nestjs/common';
import { WorkersRepository } from './workers.repository';

@Injectable()
export class WorkersService {
    constructor(private workersRepo: WorkersRepository) {}

    async getAgents(agencyId: string) {
        return this.workersRepo.getAgents(agencyId);
    }

    async addAgent(agencyId: string, agent: any) {
        return this.workersRepo.addAgent(agencyId, agent);
    }

    async removeAgent(agencyId: string, agentId: string) {
        return this.workersRepo.removeAgent(agencyId, agentId);
    }

    async editAgent(agencyId: string, agentId: string, updates: any) {
        return this.workersRepo.editAgent(agencyId, agentId, updates);
    }

    async getAllDrivers() {
        return this.workersRepo.getAllDrivers();
    }

    async getDriverByRoute(routeKey: string) {
        return this.workersRepo.getDriverByRoute(routeKey);
    }

    async setDriver(routeKey: string, name: string, vehicle: string) {
        return this.workersRepo.setDriver(routeKey, name, vehicle);
    }

    async deleteDriver(routeKey: string) {
        return this.workersRepo.deleteDriver(routeKey);
    }

    async assignAgentToShipment(agencyId: string, trackingId: string, agentId: string) {
        return this.workersRepo.assignAgentToShipment(agencyId, trackingId, agentId);
    }

    async getAssignment(agencyId: string, trackingId: string) {
        return this.workersRepo.getAssignment(agencyId, trackingId);
    }

    async getAllAssignments(agencyId: string) {
        return this.workersRepo.getAllAssignments(agencyId);
    }
}
