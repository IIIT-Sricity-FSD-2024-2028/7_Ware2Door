import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ example: 'user@ware2door.com', description: 'Email address to reset password for' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email format' })
    email!: string;

    @ApiProperty({ example: '000000', description: '6-digit OTP (use 000000 for now)' })
    @IsNotEmpty({ message: 'OTP is required' })
    otp!: string;

    @ApiProperty({ example: 'newSecurePass123', description: 'New password (min 6 characters)' })
    @IsNotEmpty({ message: 'New password is required' })
    @MinLength(6, { message: 'New password must be at least 6 characters long' })
    newPassword!: string;
}
