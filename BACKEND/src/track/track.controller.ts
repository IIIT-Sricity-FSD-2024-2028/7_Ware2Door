import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TrackService } from './track.service';
import { Public } from '../auth/public.decorator';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
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
    @Throttle({ public: { limit: 60, ttl: 60000 } })
    @ApiOperation({ summary: 'Get full tracking details for a shipment (public)' })
    @ApiParam({ name: 'id', description: 'Shipment tracking ID' })
    @Get(':id')
    getTrackingInfo(@Param('id') id: string) {
        this.logger.log(`track → ${id}`);
        return this.trackService.getTrackingDetails(id);
    }
}
