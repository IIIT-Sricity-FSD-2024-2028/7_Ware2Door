import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordAttemptDto {
    @ApiProperty({ example: 'Not Available', enum: ['Not Available', 'Address Not Found', 'Customer Refused', 'Other'], description: 'Reason delivery attempt failed' })
    @IsIn(['Not Available', 'Address Not Found', 'Customer Refused', 'Other'],
        { message: 'failStatus must be one of: Not Available, Address Not Found, Customer Refused, Other' })
    @IsNotEmpty({ message: 'Failure status is required' })
    failStatus!: string;

    @ApiPropertyOptional({ example: 'Customer was not home', description: 'Additional notes about the failed attempt' })
    @IsString()
    @IsOptional()
    notes?: string;
}
