import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class WorkersRepository {
    private agentsPath = join(__dirname, 'agents.json');
    private driversPath = join(__dirname, 'drivers.json');
    private agencyShipmentsPath = join(__dirname, '..', 'node', 'agency-shipments.json');

    private async readJson(path: string) {
        const c = await readFile(path, 'utf-8').catch(() => '{}');
        return JSON.parse(c);
    }
    
    private async writeJson(path: string, data: any) {
        await writeFile(path, JSON.stringify(data, null, 2));
    }

    async getAgents(agencyId: string) {
        const data = await this.readJson(this.agentsPath);
        return data[agencyId] || [];
    }

    async addAgent(agencyId: string, agent: any) {
        const data = await this.readJson(this.agentsPath);
        if (!data[agencyId]) data[agencyId] = [];
        data[agencyId].push(agent);
        await this.writeJson(this.agentsPath, data);
        return agent;
    }

    async removeAgent(agencyId: string, agentId: string) {
        const data = await this.readJson(this.agentsPath);
        if (!data[agencyId]) return null;
        const agent = data[agencyId].find((a: any) => a.id === agentId);
        data[agencyId] = data[agencyId].filter((a: any) => a.id !== agentId);
        await this.writeJson(this.agentsPath, data);
        return agent;
    }

    async editAgent(agencyId: string, agentId: string, updates: any) {
        const data = await this.readJson(this.agentsPath);
        if (!data[agencyId]) return null;
        const index = data[agencyId].findIndex((a: any) => a.id === agentId);
        if (index === -1) return null;
        data[agencyId][index] = { ...data[agencyId][index], ...updates };
        await this.writeJson(this.agentsPath, data);
        return data[agencyId][index];
    }

    async getAllDrivers() {
        const data = await this.readJson(this.driversPath);
        return Object.entries(data).map(([routeKey, info]: [string, any]) => ({
            routeKey,
            name: info.name,
            vehicle: info.vehicle
        }));
    }

    async getDriverByRoute(routeKey: string) {
        const data = await this.readJson(this.driversPath);
        if (!data[routeKey]) return null;
        return { routeKey, ...data[routeKey] };
    }

    async setDriver(routeKey: string, name: string, vehicle: string) {
        const data = await this.readJson(this.driversPath);
        data[routeKey] = { name, vehicle };
        await this.writeJson(this.driversPath, data);
        return { routeKey, name, vehicle };
    }

    async deleteDriver(routeKey: string) {
        const data = await this.readJson(this.driversPath);
        if (!data[routeKey]) return null;
        const removed = { routeKey, ...data[routeKey] };
        delete data[routeKey];
        await this.writeJson(this.driversPath, data);
        return removed;
    }

    async getDriverInfo(routeKey: string) {
        const data = await this.readJson(this.driversPath);
        return data[routeKey] || { name: 'Unregistered Driver', vehicle: 'N/A' };
    }

    async assignAgentToShipment(agencyId: string, trackingId: string, agentId: string) {
        const agents = await this.readJson(this.agentsPath);
        const agentList: any[] = agents[agencyId] || [];
        const agent = agentList.find((a: any) => a.id === agentId);
        if (!agent) return { success: false, error: 'Agent not found in this agency' };

        const agState = await this.readJson(this.agencyShipmentsPath);
        if (!agState[agencyId]) agState[agencyId] = { agentAssignments: {}, deliveries: [], rto: [] };
        if (!agState[agencyId].agentAssignments) agState[agencyId].agentAssignments = {};
        agState[agencyId].agentAssignments[trackingId] = { agentId, agentName: agent.name };
        await this.writeJson(this.agencyShipmentsPath, agState);
        return { success: true, agentId, agentName: agent.name };
    }

    async getAssignment(agencyId: string, trackingId: string) {
        const agState = await this.readJson(this.agencyShipmentsPath);
        const assignment = agState[agencyId]?.agentAssignments?.[trackingId] || null;
        if (!assignment) return null;
        const agents = await this.readJson(this.agentsPath);
        const agent = (agents[agencyId] || []).find((a: any) => a.id === assignment.agentId);
        return { ...assignment, agentName: agent?.name || assignment.agentName || 'Unknown' };
    }

    async getAllAssignments(agencyId: string) {
        const agState = await this.readJson(this.agencyShipmentsPath);
        const assignments: any = agState[agencyId]?.agentAssignments || {};
        const agents = await this.readJson(this.agentsPath);
        const agentList: any[] = agents[agencyId] || [];
        return Object.entries(assignments).map(([trackingId, asgn]: [string, any]) => {
            const agent = agentList.find((a: any) => a.id === asgn.agentId);
            return { trackingId, agentId: asgn.agentId, agentName: agent?.name || asgn.agentName || 'Unknown' };
        });
    }

    async lookupAgentName(agencyId: string, agentId: string): Promise<string> {
        const agents = await this.readJson(this.agentsPath);
        const agent = (agents[agencyId] || []).find((a: any) => a.id === agentId);
        return agent?.name || 'Unknown Agent';
    }
}
