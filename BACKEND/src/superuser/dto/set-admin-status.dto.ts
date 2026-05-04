import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetAdminStatusDto {
    @ApiProperty({ example: true, description: 'Set to true to activate, false to deactivate the admin' })
    @IsNotEmpty({ message: 'Active status is required.' })
    @IsBoolean({ message: 'Active must be a boolean (true or false).' })
    active!: boolean;
}

