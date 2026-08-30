import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy {
    constructor(private jwtService: JwtService) {}

    validate(req: Request): any {
        const auth = req.headers['authorization'];
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : req.cookies?.['w2d_token'];
        if (!token) throw new UnauthorizedException('No session token. Please log in.');
        try {
            return this.jwtService.verify(token);
        } catch (e: any) {
            if (e.name === 'TokenExpiredError') throw new UnauthorizedException('Session expired. Please log in again.');
            throw new UnauthorizedException('Invalid session token. Please log in.');
        }
    }
}
