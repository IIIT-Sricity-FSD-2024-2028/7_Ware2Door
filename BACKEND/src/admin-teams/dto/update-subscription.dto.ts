import { IsIn, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubscriptionDto {
    @ApiPropertyOptional({ enum: ['Starter', 'Growth', 'Enterprise'] })
    @IsOptional()
    @IsIn(['Starter', 'Growth', 'Enterprise'])
    tier?: string;

    @ApiPropertyOptional({ example: '2026-08-01' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ example: '2026-09-01' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ example: 2000 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    monthlyRate?: number;
}
