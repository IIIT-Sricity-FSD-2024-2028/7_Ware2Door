import { Controller, Get, Post, Param, Body, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { RtoService } from './rto.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { AllExceptionsFilter } from '../common/all-exceptions.filter';
import { ModuleLogger } from '../common/module-logger';
import { AccountThrottlerGuard } from '../auth/account-throttler.guard';

@ApiTags('RTO')
@ApiSecurity('x-role')
@UseFilters(AllExceptionsFilter, HttpExceptionFilter)
@UseGuards(AccountThrottlerGuard)
@Controller()
export class RtoController {
    private readonly logger = new ModuleLogger('rto');

    constructor(private readonly rtoService: RtoService) {}

    @ApiOperation({ summary: 'Create a Return to Origin (RTO) request' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @ApiBody({ schema: { type: 'object', properties: { trackingId: { type: 'string', example: 'TRK-HYD-20240001' }, reason: { type: 'string', example: 'Customer Refused' }, notes: { type: 'string', example: 'Customer refused to accept the package' } } } })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/rto')
    createRto(@Param('agencyId') agencyId: string, @Body() body: any) {
        this.logger.log(`createRTO → agency=${agencyId} tracking=${body.trackingId} reason=${body.reason}`);
        return this.rtoService.createRto(agencyId, body);
    }

    @ApiOperation({ summary: 'Get all RTOs for an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/rto')
    getAgencyRtos(@Param('agencyId') agencyId: string) {
        this.logger.log(`getAgencyRTOs → agency=${agencyId}`);
        return this.rtoService.getAgencyRtos(agencyId);
    }

    @ApiOperation({ summary: 'Get all RTOs (optionally filtered by warehouse)' })
    @ApiQuery({ name: 'warehouseId', required: false, description: 'Filter by warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/rto')
    getAllRtos(@Query('warehouseId') warehouseId?: string) {
        this.logger.log(`getAllRTOs${warehouseId ? ` → warehouse=${warehouseId}` : ''}`);
        return this.rtoService.getAllRtos(warehouseId);
    }

    @ApiOperation({ summary: 'Get a specific RTO by ID' })
    @ApiParam({ name: 'rtoId', description: 'RTO ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/rto/:rtoId')
    getRtoById(@Param('rtoId') rtoId: string) {
        this.logger.log(`getRTO → ${rtoId}`);
        return this.rtoService.getRtoById(rtoId);
    }

    @ApiOperation({ summary: 'In-scan an RTO at the warehouse' })
    @ApiParam({ name: 'rtoId', description: 'RTO ID' })
    @Roles(Role.WAREHOUSE)
    @Post('/rto/:rtoId/warehouse-inscan')
    warehouseInscan(@Param('rtoId') rtoId: string) {
        this.logger.log(`warehouseInscanRTO → ${rtoId}`);
        return this.rtoService.warehouseInscan(rtoId);
    }
}
