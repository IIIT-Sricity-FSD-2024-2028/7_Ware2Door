import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TrackService } from './track.service';
import { Public } from '../auth/public.decorator';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { AllExceptionsFilter } from '../common/all-exceptions.filter';
import { ModuleLogger } from '../common/module-logger';

@ApiTags('Tracking')
@UseFilters(AllExceptionsFilter, HttpExceptionFilter)
@Controller('track')
export class TrackController {
    private readonly logger = new ModuleLogger('track');

    constructor(private readonly trackService: TrackService) {}

    @Public()
    @UseGuards(ThrottlerGuard)
    @SkipThrottle({ default: true })
    @Throttle({ public: { limit: 500, ttl: 300000 } })
    @ApiOperation({ summary: 'Get full tracking details for a shipment (public)' })
    @ApiParam({ name: 'id', description: 'Shipment tracking ID' })
    @Get(':id')
    getTrackingInfo(@Param('id') id: string) {
        this.logger.log(`track → ${id}`);
        return this.trackService.getTrackingDetails(id);
    }
}
