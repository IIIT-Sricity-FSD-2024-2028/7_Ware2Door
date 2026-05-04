import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { NodeModule } from './node/node.module';
import { TrackModule } from './track/track.module';
import { TicketsModule } from './tickets/tickets.module';
import { ScanModule } from './scan/scan.module';
import { ReportsModule } from './reports/reports.module';
import { WorkersModule } from './workers/workers.module';
import { RtoModule } from './rto/rto.module';
import { SuperUserModule } from './superuser/superuser.module';

@Module({
    imports: [
        AuthModule,
        ShipmentsModule,
        NodeModule,
        TrackModule,
        TicketsModule,
        ScanModule,
        ReportsModule,
        WorkersModule,
        RtoModule,
        SuperUserModule,
    ],
})
export class AppModule {}