import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DispatchShipmentDto {
    @ApiProperty({ example: 'ORD-12345', description: 'Order ID to dispatch' })
    @IsString()
    @IsNotEmpty({ message: 'Order ID is required' })
    orderId!: string;

    @ApiProperty({ example: 'HUB-BLR-001', description: 'Transit hub ID to route through' })
    @IsString()
    @IsNotEmpty({ message: 'Hub ID is required' })
    hubId!: string;

    @ApiProperty({ example: 'AGY-BLR-001', description: 'Local agency ID for last-mile delivery' })
    @IsString()
    @IsNotEmpty({ message: 'Agency ID is required' })
    agencyId!: string;
}
