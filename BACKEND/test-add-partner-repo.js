"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_teams_repository_1 = require("./src/admin-teams/admin-teams.repository");
async function run() {
    const repo = new admin_teams_repository_1.AdminTeamsRepository();
    try {
        const result = await repo.addPartner({ name: 'Flipkart', email: 'f@f.com', tier: 'Growth' });
        console.log('Result:', result);
    }
    catch (e) {
        console.error('Error:', e);
    }
}
run();
