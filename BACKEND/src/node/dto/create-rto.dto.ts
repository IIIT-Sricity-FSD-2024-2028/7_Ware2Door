import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRtoDto {
    @IsString()
    @IsNotEmpty({ message: 'Tracking ID is required' })
    trackingId!: string;

    @IsString()
    @IsNotEmpty({ message: 'RTO reason is required' })
    reason!: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    customerName?: string;

    @IsString()
    @IsOptional()
    agentId?: string;

    @IsString()
    @IsOptional()
    agentName?: string;
}
