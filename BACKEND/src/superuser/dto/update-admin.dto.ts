import {
    IsString,
    IsEmail,
    IsOptional,
    Matches,
    MinLength,
    MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdminDto {
    @ApiPropertyOptional({ example: 'Hyderabad Warehouse', description: 'Updated name (3-80 chars)' })
    @IsOptional()
    @IsString()
    @MinLength(3, { message: 'Name must be at least 3 characters.' })
    @MaxLength(80, { message: 'Name must not exceed 80 characters.' })
    @Matches(/^[a-zA-Z0-9 \-'\.]+$/, {
        message: 'Name may only contain letters, numbers, spaces, hyphens, apostrophes, and dots.',
    })
    name?: string;

    @ApiPropertyOptional({ example: 'new@ware2door.com', description: 'Updated email address' })
    @IsOptional()
    @IsEmail({}, { message: 'Email must be a valid email address.' })
    @MaxLength(100, { message: 'Email must not exceed 100 characters.' })
    email?: string;

    @ApiPropertyOptional({ example: '9876543210', description: 'Updated 10-digit Indian mobile number' })
    @IsOptional()
    @Matches(/^(\+91[\s\-]?)?\d{10}$/, {
        message: 'Phone must be a valid 10-digit Indian mobile number.',
    })
    phone?: string;

    @ApiPropertyOptional({ example: 'Mumbai', description: 'Updated city' })
    @IsOptional()
    @IsString()
    @MaxLength(60, { message: 'City must not exceed 60 characters.' })
    city?: string;
}
