import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SetConfigDto {
    @ApiPropertyOptional({ example: 50, description: 'Threshold below which stock is flagged as low (1-10000)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Low stock threshold must be a whole number.' })
    @Min(1, { message: 'Low stock threshold must be at least 1.' })
    @Max(10000, { message: 'Low stock threshold must not exceed 10,000.' })
    lowStockThreshold?: number;

    @ApiPropertyOptional({ example: 3, description: 'Maximum delivery attempts before initiating RTO (1-10)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Max RTO attempts must be a whole number.' })
    @Min(1, { message: 'Max RTO attempts must be at least 1.' })
    @Max(10, { message: 'Max RTO attempts must not exceed 10.' })
    maxRtoAttempts?: number;
}

