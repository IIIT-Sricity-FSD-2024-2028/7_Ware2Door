import {
    IsString, IsEmail, IsNotEmpty, Matches, IsIn, MinLength, MaxLength, IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdminDto {
    @ApiProperty({ example: 'WareHouse', enum: ['WareHouse', 'TransitHub', 'LocalAgency'], description: 'Role of the admin node' })
    @IsNotEmpty({ message: 'Role is required.' })
    @IsIn(['WareHouse', 'TransitHub', 'LocalAgency'], { message: 'Role must be one of: WareHouse, TransitHub, LocalAgency.' })
    role!: string;

    @ApiProperty({ example: 'Hyderabad Warehouse', description: 'Name of the admin/facility (3-80 chars)' })
    @IsNotEmpty({ message: 'Name is required.' })
    @IsString()
    @MinLength(3, { message: 'Name must be at least 3 characters.' })
    @MaxLength(80, { message: 'Name must not exceed 80 characters.' })
    @Matches(/^[a-zA-Z0-9 \-'\.]+$/, { message: 'Name may only contain letters, numbers, spaces, hyphens, apostrophes, and dots.' })
    name!: string;

    @ApiProperty({ example: 'hyd.warehouse@ware2door.com', description: 'Valid email address' })
    @IsNotEmpty({ message: 'Email is required.' })
    @IsEmail({}, { message: 'Email must be a valid email address.' })
    @MaxLength(100, { message: 'Email must not exceed 100 characters.' })
    email!: string;

    @ApiProperty({ example: '9876543210', description: 'Valid 10-digit Indian mobile number' })
    @IsNotEmpty({ message: 'Phone number is required.' })
    @Matches(/^(\+91[\s\-]?)?\d{10}$/, { message: 'Phone must be a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 9876543210).' })
    phone!: string;

    @ApiPropertyOptional({ example: 'Hyderabad Central Warehouse', description: 'Facility name (optional)' })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Facility name must not exceed 100 characters.' })
    facility?: string;

    @ApiProperty({ example: 'Hyderabad', description: 'City where the node is located' })
    @IsNotEmpty({ message: 'City is required.' })
    @IsString()
    @MinLength(2, { message: 'City must be at least 2 characters.' })
    @MaxLength(60, { message: 'City must not exceed 60 characters.' })
    @Matches(/^[a-zA-Z\s\-']+$/, { message: 'City name may only contain letters, spaces, hyphens, and apostrophes.' })
    city!: string;

    @ApiPropertyOptional({ example: 'Admin@123', description: 'Initial password (6-64 chars, optional)' })
    @IsOptional()
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters.' })
    @MaxLength(64, { message: 'Password must not exceed 64 characters.' })
    password?: string;
}

