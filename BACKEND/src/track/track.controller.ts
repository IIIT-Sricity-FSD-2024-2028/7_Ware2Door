import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TrackService } from './track.service';
import { Public } from '../auth/public.decorator';

@ApiTags('Tracking')
@Controller('track')
export class TrackController {
    constructor(private readonly trackService: TrackService) {}

    @Public()
    @ApiOperation({ summary: 'Get full tracking details for a shipment (public)' })
    @ApiParam({ name: 'id', description: 'Shipment tracking ID' })
    @Get(':id')
    getTrackingInfo(@Param('id') id: string) {
        return this.trackService.getTrackingDetails(id);
    }
}

