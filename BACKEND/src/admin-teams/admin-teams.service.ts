import { Injectable } from '@nestjs/common';
import { AdminTeamsRepository } from './admin-teams.repository';

@Injectable()
export class AdminTeamsService {
    constructor(private readonly repo: AdminTeamsRepository) { }

    getAllNodes() { return this.repo.getAllNodes(); }
    addNode(body: any) { return this.repo.addNode(body); }
    updateSubscription(nodeId: string, sub: any) { return this.repo.updateSubscription(nodeId, sub); }
    toggleNodeStatus(nodeId: string, isActive: boolean) { return this.repo.toggleNodeStatus(nodeId, isActive); }
    addLegalDoc(nodeId: string, name: string, path: string) { return this.repo.addLegalDoc(nodeId, name, path); }
    getLegalDocs(nodeId: string) { return this.repo.getLegalDocs(nodeId); }

    getAllDrivers() { return this.repo.getAllDrivers(); }
    async addDriver(body: any) {
        const nodes = await this.repo.getAllNodes();
        return this.repo.addDriver(body, nodes);
    }
    updateDriver(id: string, body: any) { return this.repo.updateDriver(id, body); }
    deleteDriver(id: string) { return this.repo.deleteDriver(id); }

    getAllEscalations() { return this.repo.getAllEscalations(); }
    escalateTicket(ticketId: string, note: string, assignedTo?: string) {
        return this.repo.escalateTicket(ticketId, note, assignedTo);
    }
    updateEscalation(ticketId: string, body: any) { return this.repo.updateEscalation(ticketId, body); }

    ensureUploadDir(nodeId: string) { return this.repo.ensureUploadDir(nodeId); }

    getNodePerformance() { return this.repo.getNodePerformance(); }

    getAllPartners() { return this.repo.getAllPartners(); }
    addPartner(body: any) { return this.repo.addPartner(body); }
    setPartnerStatus(id: string, isActive: boolean) { return this.repo.setPartnerStatus(id, isActive); }
    changePartnerTier(id: string, tier: string) { return this.repo.changePartnerTier(id, tier); }
    deletePartner(id: string) { return this.repo.deletePartner(id); }
    regenerateApiKey(id: string) { return this.repo.regenerateApiKey(id); }
}

