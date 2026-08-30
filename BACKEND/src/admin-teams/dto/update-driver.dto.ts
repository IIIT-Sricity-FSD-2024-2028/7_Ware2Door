import { IsString, IsOptional, IsIn, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDriverDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    licenseNo?: string;

    @ApiPropertyOptional({ enum: ['Bike', 'Van', 'Truck', 'Auto'] })
    @IsOptional()
    @IsIn(['Bike', 'Van', 'Truck', 'Auto'])
    vehicleType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fromNodeId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    toNodeId?: string;

    @ApiPropertyOptional({ example: '2026-08-01' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ example: '2026-08-31' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    monthlyFee?: number;
}
