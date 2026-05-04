import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScanDto {
    @ApiProperty({ example: 'TRK-HYD-20240001', description: 'Tracking ID of the shipment to scan' })
    @IsString()
    @IsNotEmpty({ message: 'Tracking ID is required' })
    trackingId!: string;
}
