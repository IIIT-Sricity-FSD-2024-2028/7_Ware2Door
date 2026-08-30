import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EscalateTicketDto {
    @ApiProperty({ example: 'Customer not reachable after 3 attempts' })
    @IsString()
    @IsNotEmpty()
    escalationNote!: string;

    @ApiPropertyOptional({ example: 'officer-001' })
    @IsOptional()
    @IsString()
    assignedTo?: string;
}
