import { IsString, IsNotEmpty, IsIn, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
    @ApiProperty({ example: 'TRK-HYD-20240001', description: 'Tracking ID of the shipment' })
    @IsString()
    @IsNotEmpty({ message: 'Tracking ID is required' })
    trackingId!: string;

    @ApiProperty({ example: 'Delayed Shipment', enum: ['Delayed Shipment', 'Damaged Package', 'Billing & Invoices', 'Return to Origin', 'Address Change', 'Other Issues'], description: 'Category of the support ticket' })
    @IsIn(['Delayed Shipment', 'Damaged Package', 'Billing & Invoices', 'Return to Origin', 'Address Change', 'Other Issues'],
        { message: 'Category must be one of: Delayed Shipment, Damaged Package, Billing & Invoices, Return to Origin, Address Change, Other Issues' })
    @IsNotEmpty({ message: 'Category is required' })
    category!: string;

    @ApiProperty({ example: 'My shipment has been delayed for over 5 days.', description: 'Detailed description of the issue (min 10 characters)' })
    @IsString()
    @IsNotEmpty({ message: 'Description is required' })
    @MinLength(10, { message: 'Description must be at least 10 characters long' })
    description!: string;
}

