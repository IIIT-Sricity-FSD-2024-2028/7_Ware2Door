import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin@ware2door.com', description: 'Registered email address' })
    @IsEmail({}, { message: 'Email must be a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email!: string;

    @ApiProperty({ example: 'password123', description: 'Account password' })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    password!: string;
}
