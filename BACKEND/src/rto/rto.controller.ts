import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { RtoService } from './rto.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@ApiTags('RTO')
@ApiSecurity('x-role')
@Controller()
export class RtoController {
    constructor(private readonly rtoService: RtoService) {}

    @ApiOperation({ summary: 'Create a Return to Origin (RTO) request' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @ApiBody({ schema: { type: 'object', properties: { trackingId: { type: 'string', example: 'TRK-HYD-20240001' }, reason: { type: 'string', example: 'Customer Refused' }, notes: { type: 'string', example: 'Customer refused to accept the package' } } } })
    @Roles(Role.LOCAL_AGENCY)
    @Post('/agency/:agencyId/rto')
    createRto(@Param('agencyId') agencyId: string, @Body() body: any) {
        return this.rtoService.createRto(agencyId, body);
    }

    @ApiOperation({ summary: 'Get all RTOs for an agency' })
    @ApiParam({ name: 'agencyId', description: 'Agency ID' })
    @Roles(Role.LOCAL_AGENCY)
    @Get('/agency/:agencyId/rto')
    getAgencyRtos(@Param('agencyId') agencyId: string) {
        return this.rtoService.getAgencyRtos(agencyId);
    }

    @ApiOperation({ summary: 'Get all RTOs (optionally filtered by warehouse)' })
    @ApiQuery({ name: 'warehouseId', required: false, description: 'Filter by warehouse ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/rto')
    getAllRtos(@Query('warehouseId') warehouseId?: string) {
        return this.rtoService.getAllRtos(warehouseId);
    }

    @ApiOperation({ summary: 'Get a specific RTO by ID' })
    @ApiParam({ name: 'rtoId', description: 'RTO ID' })
    @Roles(Role.WAREHOUSE)
    @Get('/rto/:rtoId')
    getRtoById(@Param('rtoId') rtoId: string) {
        return this.rtoService.getRtoById(rtoId);
    }

    @ApiOperation({ summary: 'In-scan an RTO at the warehouse' })
    @ApiParam({ name: 'rtoId', description: 'RTO ID' })
    @Roles(Role.WAREHOUSE)
    @Post('/rto/:rtoId/warehouse-inscan')
    warehouseInscan(@Param('rtoId') rtoId: string) {
        return this.rtoService.warehouseInscan(rtoId);
    }
}

