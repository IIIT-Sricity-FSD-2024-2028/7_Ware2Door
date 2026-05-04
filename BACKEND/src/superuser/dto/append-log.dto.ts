import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppendLogDto {
    @ApiProperty({ example: 'Super Admin', description: 'Name of the admin performing the action (max 80 chars)' })
    @IsNotEmpty({ message: 'Admin field is required.' })
    @IsString()
    @MaxLength(80, { message: 'Admin name must not exceed 80 characters.' })
    admin!: string;

    @ApiProperty({ example: 'Shipments', description: 'Module where the action was performed (max 60 chars)' })
    @IsNotEmpty({ message: 'Module is required.' })
    @IsString()
    @MaxLength(60, { message: 'Module name must not exceed 60 characters.' })
    module!: string;

    @ApiProperty({ example: 'Cancel All Pending', description: 'Action that was performed (max 100 chars)' })
    @IsNotEmpty({ message: 'Action is required.' })
    @IsString()
    @MaxLength(100, { message: 'Action must not exceed 100 characters.' })
    action!: string;

    @ApiProperty({ example: 'Cancelled all pending shipments for WH-HYD-001', description: 'Detailed description of the action (max 500 chars)' })
    @IsNotEmpty({ message: 'Details are required.' })
    @IsString()
    @MaxLength(500, { message: 'Details must not exceed 500 characters.' })
    details!: string;
}

