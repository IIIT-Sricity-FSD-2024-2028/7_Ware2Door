import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { NodeModule } from './node/node.module';
import { TrackModule } from './track/track.module';
import { TicketsModule } from './tickets/tickets.module';
import { ScanModule } from './scan/scan.module';
import { ReportsModule } from './reports/reports.module';
import { WorkersModule } from './workers/workers.module';
import { RtoModule } from './rto/rto.module';
import { AdminTeamsModule } from './admin-teams/admin-teams.module';

@Module({
    imports: [
        ThrottlerModule.forRoot([
            { name: 'default', ttl: 60000, limit: 120 },
            { name: 'auth', ttl: 300000, limit: 10 },
            { name: 'authIp', ttl: 300000, limit: 500 },
            { name: 'account', ttl: 300000, limit: 500 },
            { name: 'public', ttl: 300000, limit: 500 },
        ]),
        AuthModule,
        ShipmentsModule,
        NodeModule,
        TrackModule,
        TicketsModule,
        ScanModule,
        ReportsModule,
        WorkersModule,
        RtoModule,
        AdminTeamsModule,
    ],
})
export class AppModule { }