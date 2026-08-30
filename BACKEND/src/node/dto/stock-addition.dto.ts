import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockAdditionDto {
    @ApiPropertyOptional({ example: 'LBL-001', description: 'Optional label ID for the stock item' })
    @IsString()
    @IsOptional()
    labelID?: string;

    @ApiProperty({ example: 'Laptop', description: 'Name of the item being added to stock' })
    @IsString()
    @IsNotEmpty({ message: 'Item name is required' })
    itemName!: string;

    @ApiProperty({ example: 10, description: 'Quantity to add (minimum 1)' })
    @IsInt({ message: 'Quantity must be a whole number' })
    @Min(1, { message: 'Quantity must be at least 1' })
    quantity!: number;
}
