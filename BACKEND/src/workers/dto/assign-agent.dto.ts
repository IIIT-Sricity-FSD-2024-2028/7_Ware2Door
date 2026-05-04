import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignAgentDto {
    @ApiProperty({ example: 'TRK-HYD-20240001', description: 'Tracking ID of the shipment to assign' })
    @IsString()
    @IsNotEmpty({ message: 'Tracking ID is required' })
    trackingId!: string;

    @ApiProperty({ example: 'AGT-BLR001-1710000000000', description: 'ID of the agent to assign' })
    @IsString()
    @IsNotEmpty({ message: 'Agent ID is required' })
    agentId!: string;
}

