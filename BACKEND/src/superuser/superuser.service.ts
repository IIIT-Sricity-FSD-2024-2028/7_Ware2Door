import { Injectable } from '@nestjs/common';
import { SuperUserRepository } from './superuser.repository';

@Injectable()
export class SuperUserService {
    constructor(private readonly repo: SuperUserRepository) {}

    getOverview() { return this.repo.getOverview(); }

    getAllAdmins() { return this.repo.getAllAdmins(); }
    createAdmin(body: any) { return this.repo.createAdmin(body); }
    updateAdmin(id: string, body: any) { return this.repo.updateAdmin(id, body); }
    deleteAdmin(id: string) { return this.repo.deleteAdmin(id); }
    setAdminStatus(id: string, active: boolean) { return this.repo.setAdminStatus(id, active); }

    getWarehouses() { return this.repo.getWarehouses(); }
    getWarehouseDrilldown(id: string) { return this.repo.getWarehouseDrilldown(id); }
    cancelAllPending(id: string) { return this.repo.cancelAllPending(id); }
    cancelSinglePending(id: string, orderId: string) { return this.repo.cancelSinglePending(id, orderId); }

    getHubs() { return this.repo.getHubs(); }
    getHubDrilldown(id: string) { return this.repo.getHubDrilldown(id); }
    outscanAllHubShipments(id: string) { return this.repo.outscanAllHubShipments(id); }

    getAgencies() { return this.repo.getAgencies(); }
    getAgencyDrilldown(id: string) { return this.repo.getAgencyDrilldown(id); }
    updateAgentStatus(id: string, agentId: string, status: string) { return this.repo.updateAgentStatus(id, agentId, status); }

    getAllShipments() { return this.repo.getAllShipments(); }
    getAllRTO() { return this.repo.getAllRTO(); }
    getAllTickets() { return this.repo.getAllTickets(); }

    getLogs() { return this.repo.getLogs(); }
    appendLog(body: any) { return this.repo.appendLog(body); }

    getConfig() { return this.repo.getConfig(); }
    setConfig(body: any) { return this.repo.setConfig(body); }
}
