import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';
import { JwtStrategy } from './jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {

    constructor(
        private reflector: Reflector,
        private jwtStrategy: JwtStrategy,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const payload = this.jwtStrategy.validate(request);
        request.user = payload;

        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) return true;

        const hasRole = requiredRoles.some(role => role === payload.role);
        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied. Required role: [${requiredRoles.join(' | ')}]. Your role: ${payload.role}.`,
            );
        }

        return true;
    }
}
