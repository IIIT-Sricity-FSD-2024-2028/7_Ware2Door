import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgentDto {
    @ApiProperty({ example: 'Arjun Sharma', description: 'Full name of the delivery agent' })
    @IsString()
    @IsNotEmpty({ message: 'Agent name is required' })
    name!: string;

    @ApiProperty({ example: '9876543210', description: 'Valid 10-digit phone number with optional country code' })
    @Matches(/^(\+\d{1,3}[\s-]?)?\d{10}$/, { message: 'Phone must be a valid 10-digit number, optionally with country code' })
    @IsNotEmpty({ message: 'Phone is required' })
    phone!: string;

    @ApiPropertyOptional({ example: 'arjun@agency.com', description: 'Agent email address (optional)' })
    @IsEmail({}, { message: 'Email must be a valid email address' })
    @IsOptional()
    email?: string;

    @ApiProperty({ example: 'Koramangala, Bangalore', description: 'Delivery area assigned to the agent' })
    @IsString()
    @IsNotEmpty({ message: 'Area is required' })
    area!: string;
}

