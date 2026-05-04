import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTicketStatusDto {
    @ApiProperty({ example: 'In Progress', enum: ['Open', 'In Progress', 'Resolved', 'Closed'], description: 'New status for the ticket' })
    @IsString()
    @IsNotEmpty({ message: 'Status is required' })
    @IsIn(['Open', 'In Progress', 'Resolved', 'Closed'], { message: 'Status must be Open, In Progress, Resolved, or Closed' })
    status!: string;
}

