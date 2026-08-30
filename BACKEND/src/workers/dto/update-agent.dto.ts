import { IsEmail, IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAgentDto {
    @ApiPropertyOptional({ example: 'Arjun Sharma', description: 'Updated name of the agent' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ example: '9876543210', description: 'Updated 10-digit phone number' })
    @Matches(/^(\+\d{1,3}[\s-]?)?\d{10}$/, { message: 'Phone must be a valid 10-digit number, optionally with country code' })
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ example: 'arjun@agency.com', description: 'Updated email address' })
    @IsEmail({}, { message: 'Email must be a valid email address' })
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({ example: 'Indiranagar, Bangalore', description: 'Updated delivery area' })
    @IsString()
    @IsOptional()
    area?: string;

    @ApiPropertyOptional({ example: 'Active', enum: ['Active', 'Busy', 'Offline'], description: 'Current status of the agent' })
    @IsIn(['Active', 'Busy', 'Offline'], { message: 'Status must be one of: Active , Busy , Offline' })
    @IsOptional()
    status?: string;
}

