import { IsString, IsNotEmpty, IsInt, IsOptional, Min, Matches, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePendingShipmentDto {
    @ApiProperty({ example: 'ORD-12345', description: 'Unique order ID' })
    @IsString()
    @IsNotEmpty({ message: 'Order ID is required' })
    orderId!: string;

    @ApiProperty({ example: 'WH-HYD-001', description: 'Source warehouse ID' })
    @IsString()
    @IsNotEmpty({ message: 'Source is required' })
    source!: string;

    @ApiProperty({ example: 'Ravi Kumar', description: 'Customer full name' })
    @IsString()
    @IsNotEmpty({ message: 'Customer name is required' })
    customerName!: string;

    @ApiProperty({ example: '9876543210', description: 'Customer phone (10-digit, optional country code)' })
    @Matches(/^(\+\d{1,3}[\s-]?)?\d{10}$/, { message: 'Phone must be a valid 10-digit number, optionally with country code' })
    @IsNotEmpty({ message: 'Customer phone is required' })
    customerPhone!: string;

    @ApiProperty({ example: '12, MG Road, Bangalore - 560001', description: 'Full delivery address' })
    @IsString()
    @IsNotEmpty({ message: 'Customer address is required' })
    customerAddress!: string;

    @ApiProperty({ example: 'Wireless Mouse', description: 'Name of the product being shipped' })
    @IsString()
    @IsNotEmpty({ message: 'Product name is required' })
    productName!: string;

    @ApiPropertyOptional({ example: 'SKU-WM-BLK', description: 'Product SKU code' })
    @IsString()
    @IsOptional()
    sku?: string;

    @ApiProperty({ example: 2, description: 'Quantity of items (minimum 1)' })
    @IsInt({ message: 'Quantity must be a whole number' })
    @Min(1, { message: 'Quantity must be at least 1' })
    qty!: number;

    @ApiPropertyOptional({ example: 'HIGH', enum: ['LOW', 'NORMAL', 'HIGH'], description: 'Shipment priority level' })
    @IsIn(['LOW', 'NORMAL', 'HIGH'], { message: 'Priority must be LOW, NORMAL, or HIGH' })
    @IsOptional()
    priority?: string;
}
