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

@Injectable()
export class RolesGuard implements CanActivate {

    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) return true;

        const request = context.switchToHttp().getRequest();
        const roleHeader: string = request.headers['x-role'];

        if (!roleHeader) {
            throw new UnauthorizedException(
                'Missing x-role header. Include your role in the request headers to access this resource.',
            );
        }

        const hasRole = requiredRoles.some(role => role === roleHeader);
        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied. Required role: [${requiredRoles.join(' | ')}]. Received: ${roleHeader}.`,
            );
        }

        return true;
    }
}
