import {
    Controller, Get, Post, Put, Delete,
    Param, Body, UseFilters, UsePipes, ValidationPipe,
    UseInterceptors, UploadedFiles, Req, UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { AdminTeamsService } from './admin-teams.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { AllExceptionsFilter } from '../common/all-exceptions.filter';
import { ModuleLogger } from '../common/module-logger';
import {
    AddNodeDto,
    UpdateSubscriptionDto,
    AddDriverDto,
    UpdateDriverDto,
    EscalateTicketDto,
} from './dto';
import { AccountThrottlerGuard } from '../auth/account-throttler.guard';

@ApiTags('Admin Teams')
@ApiSecurity('x-role')
@Controller('admin-teams')
@Roles(Role.ADMIN_TEAMS)
@UseGuards(AccountThrottlerGuard)
@UseFilters(AllExceptionsFilter, HttpExceptionFilter)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class AdminTeamsController {
    private readonly logger = new ModuleLogger('admin-teams');

    constructor(private readonly svc: AdminTeamsService) { }


    @ApiOperation({ summary: 'Get all nodes with subscription details' })
    @Get('nodes')
    getAllNodes() {
        this.logger.log('getAllNodes');
        return this.svc.getAllNodes();
    }

    @ApiOperation({ summary: 'Add a new node with subscription' })
    @Post('nodes')
    addNode(@Body() body: AddNodeDto) {
        this.logger.log(`addNode → ${body.email} type=${body.role}`);
        return this.svc.addNode(body);
    }

    @ApiOperation({ summary: 'Update subscription end date / monthly rate for a node' })
    @ApiParam({ name: 'id', description: 'Node ID' })
    @Put('nodes/:id/subscription')
    updateSubscription(@Param('id') id: string, @Body() body: UpdateSubscriptionDto) {
        this.logger.log(`updateSubscription → ${id}`);
        return this.svc.updateSubscription(id, body);
    }

    @ApiOperation({ summary: 'Toggle active/inactive status for a node' })
    @ApiParam({ name: 'id', description: 'Node ID' })
    @Put('nodes/:id/status')
    toggleNodeStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
        this.logger.log(`toggleNodeStatus → ${id} active=${isActive}`);
        return this.svc.toggleNodeStatus(id, isActive);
    }

    @ApiOperation({ summary: 'Upload legal documents for a node' })
    @ApiParam({ name: 'id', description: 'Node ID' })
    @ApiConsumes('multipart/form-data')
    @Post('nodes/:id/legal-docs')
    @UseInterceptors(
        FilesInterceptor('files', 10, {
            storage: diskStorage({
                destination: (req: any, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
                    const nodeId = req.params.id;
                    const dir = join(process.cwd(), 'uploads', 'legal-docs', nodeId);
                    require('fs').mkdirSync(dir, { recursive: true });
                    cb(null, dir);
                },
                filename: (req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
                    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, unique + extname(file.originalname));
                },
            }),
            fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
                const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
                if (allowed.includes(extname(file.originalname).toLowerCase())) {
                    cb(null, true);
                } else {
                    cb(new Error('Only PDF, JPG, PNG files are allowed'), false);
                }
            },
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    async uploadLegalDocs(
        @Param('id') id: string,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        this.logger.log(`uploadLegalDocs → node=${id} count=${files?.length}`);
        if (!files || files.length === 0) return { success: false, error: 'No files uploaded' };
        const results: any[] = [];
        for (const file of files) {
            const relativePath = `uploads/legal-docs/${id}/${file.filename}`;
            const res = await this.svc.addLegalDoc(id, file.originalname, relativePath);
            results.push(res);
        }
        return { success: true, uploaded: results.length, files: results.map(r => r.doc) };
    }

    @ApiOperation({ summary: 'Get legal documents list for a node' })
    @ApiParam({ name: 'id', description: 'Node ID' })
    @Get('nodes/:id/legal-docs')
    getLegalDocs(@Param('id') id: string) {
        this.logger.log(`getLegalDocs → ${id}`);
        return this.svc.getLegalDocs(id);
    }


    @ApiOperation({ summary: 'Get all fleet drivers' })
    @Get('drivers')
    getAllDrivers() {
        this.logger.log('getAllDrivers');
        return this.svc.getAllDrivers();
    }

    @ApiOperation({ summary: 'Add a new fleet driver' })
    @Post('drivers')
    addDriver(@Body() body: AddDriverDto) {
        this.logger.log(`addDriver → ${body.name} ${body.fromNodeId}→${body.toNodeId}`);
        return this.svc.addDriver(body);
    }

    @ApiOperation({ summary: 'Update driver details or subscription' })
    @ApiParam({ name: 'id', description: 'Driver ID' })
    @Put('drivers/:id')
    updateDriver(@Param('id') id: string, @Body() body: UpdateDriverDto) {
        this.logger.log(`updateDriver → ${id}`);
        return this.svc.updateDriver(id, body);
    }

    @ApiOperation({ summary: 'Remove a driver from the fleet' })
    @ApiParam({ name: 'id', description: 'Driver ID' })
    @Delete('drivers/:id')
    deleteDriver(@Param('id') id: string) {
        this.logger.log(`deleteDriver → ${id}`);
        return this.svc.deleteDriver(id);
    }


    @ApiOperation({ summary: 'Get all escalated tickets' })
    @Get('escalations')
    getAllEscalations() {
        this.logger.log('getAllEscalations');
        return this.svc.getAllEscalations();
    }

    @ApiOperation({ summary: 'Escalate a ticket to the central desk' })
    @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
    @Put('escalations/:ticketId/escalate')
    escalateTicket(@Param('ticketId') ticketId: string, @Body() body: EscalateTicketDto) {
        this.logger.log(`escalateTicket → ${ticketId}`);
        return this.svc.escalateTicket(ticketId, body.escalationNote, body.assignedTo);
    }

    @ApiOperation({ summary: 'Update escalation status / assign officer / resolve' })
    @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
    @Put('escalations/:ticketId')
    updateEscalation(@Param('ticketId') ticketId: string, @Body() body: any) {
        this.logger.log(`updateEscalation → ${ticketId} status=${body.status}`);
        return this.svc.updateEscalation(ticketId, body);
    }

    @ApiOperation({ summary: 'Get live performance metrics for all warehouses, hubs, and agencies' })
    @Get('node-performance')
    getNodePerformance() {
        this.logger.log('getNodePerformance');
        return this.svc.getNodePerformance();
    }

    @ApiOperation({ summary: 'Get all third-party partners' })
    @Get('partners')
    getAllPartners() {
        this.logger.log('getAllPartners');
        return this.svc.getAllPartners();
    }

    @ApiOperation({ summary: 'Add a new third-party partner and generate their API key' })
    @Post('partners')
    addPartner(@Body() body: any) {
        this.logger.log(`addPartner → ${body.name} tier=${body.tier}`);
        return this.svc.addPartner(body);
    }

    @ApiOperation({ summary: 'Activate or deactivate a third-party partner' })
    @ApiParam({ name: 'id', description: 'Partner ID' })
    @Put('partners/:id/status')
    setPartnerStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
        this.logger.log(`setPartnerStatus → ${id} active=${isActive}`);
        return this.svc.setPartnerStatus(id, isActive);
    }

    @ApiOperation({ summary: 'Change the subscription tier for a partner' })
    @ApiParam({ name: 'id', description: 'Partner ID' })
    @Put('partners/:id/tier')
    changePartnerTier(@Param('id') id: string, @Body('tier') tier: string) {
        this.logger.log(`changePartnerTier → ${id} tier=${tier}`);
        return this.svc.changePartnerTier(id, tier);
    }

    @ApiOperation({ summary: 'Regenerate API key for a partner' })
    @ApiParam({ name: 'id', description: 'Partner ID' })
    @Put('partners/:id/regenerate-key')
    regenerateApiKey(@Param('id') id: string) {
        this.logger.log(`regenerateApiKey → ${id}`);
        return this.svc.regenerateApiKey(id);
    }

    @ApiOperation({ summary: 'Remove a third-party partner from the network' })
    @ApiParam({ name: 'id', description: 'Partner ID' })
    @Delete('partners/:id')
    deletePartner(@Param('id') id: string) {
        this.logger.log(`deletePartner → ${id}`);
        return this.svc.deletePartner(id);
    }
}
