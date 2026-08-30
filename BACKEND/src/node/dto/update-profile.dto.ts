import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'John Doe', description: 'Full name of the user' })
    @IsString({ message: 'Name must be a string' })
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ example: 'john@ware2door.com', description: 'New email address' })
    @IsEmail({}, { message: 'Email must be a valid email address' })
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({ example: '+91 9876543210', description: 'Valid 10-digit mobile number with optional country code' })
    @Matches(/^(\+\d{1,3}[\s-]?)?\d{10}$/, { message: 'Phone must be a valid 10-digit number, optionally with country code (e.g. +91 8977568681)' })
    @IsOptional()
    phone?: string;
}
