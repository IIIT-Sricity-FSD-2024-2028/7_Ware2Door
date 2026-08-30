import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from './roles.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'w2d_jwt_secret_key_2024',
            signOptions: { expiresIn: '8h' },
        }),
    ],
    providers: [
        JwtStrategy,
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
    exports: [JwtModule, JwtStrategy],
})
export class AuthModule {}
