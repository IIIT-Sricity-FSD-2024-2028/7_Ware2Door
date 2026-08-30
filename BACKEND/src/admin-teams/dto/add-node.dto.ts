import { IsString, IsNotEmpty, IsEmail, IsIn, IsOptional, IsNumber, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscriptionDto {
    @ApiProperty({ enum: ['Starter', 'Growth', 'Enterprise'] })
    @IsIn(['Starter', 'Growth', 'Enterprise'])
    tier!: string;

    @ApiProperty({ example: '2026-08-01' })
    @IsDateString()
    startDate!: string;

    @ApiProperty({ example: '2026-09-01' })
    @IsDateString()
    endDate!: string;

    @ApiProperty({ example: 2000 })
    @IsNumber()
    @Type(() => Number)
    monthlyRate!: number;
}

export class AddNodeDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ example: 'admin@example.com' })
    @IsEmail()
    email!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    password!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    phone!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    address!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    city!: string;

    @ApiProperty({ enum: ['WareHouse', 'TransitHub', 'LocalAgency'] })
    @IsIn(['WareHouse', 'TransitHub', 'LocalAgency'])
    role!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lat?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lng?: string;

    @ApiProperty()
    @ValidateNested()
    @Type(() => SubscriptionDto)
    subscription!: SubscriptionDto;
}
