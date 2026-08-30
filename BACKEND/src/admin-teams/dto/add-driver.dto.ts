import { IsString, IsNotEmpty, IsIn, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddDriverDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    phone!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    licenseNo!: string;

    @ApiProperty({ enum: ['Bike', 'Van', 'Truck', 'Auto'] })
    @IsIn(['Bike', 'Van', 'Truck', 'Auto'])
    vehicleType!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fromNodeId!: string;

    @ApiProperty({ enum: ['WAREHOUSE', 'TRANSIT_HUB'] })
    @IsIn(['WAREHOUSE', 'TRANSIT_HUB'])
    fromNodeType!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    toNodeId!: string;

    @ApiProperty({ enum: ['TRANSIT_HUB', 'LOCAL_AGENCY'] })
    @IsIn(['TRANSIT_HUB', 'LOCAL_AGENCY'])
    toNodeType!: string;

    @ApiProperty({ example: '2026-08-01' })
    @IsDateString()
    startDate!: string;

    @ApiProperty({ example: '2026-08-31' })
    @IsDateString()
    endDate!: string;

    @ApiProperty({ example: 200 })
    @IsNumber()
    @Type(() => Number)
    monthlyFee!: number;
}
