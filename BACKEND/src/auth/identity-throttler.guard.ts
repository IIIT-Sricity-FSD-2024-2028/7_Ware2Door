import { Injectable, ExecutionContext } from '@nestjs/common';
import {
    ThrottlerGuard,
    ThrottlerModuleOptions,
    ThrottlerStorage,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class IdentityThrottlerGuard extends ThrottlerGuard {
    constructor(
        options: ThrottlerModuleOptions,
        storageService: ThrottlerStorage,
        reflector: Reflector,
    ) {
        super(options, storageService, reflector);
    }

    protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
        return false;
    }

    protected async getTracker(req: Record<string, any>): Promise<string> {
        const bodyEmail = req.body?.email;
        const userEmail = req.user?.email;
        const email = typeof bodyEmail === 'string' && bodyEmail.trim().length > 0
            ? bodyEmail
            : userEmail;
        const normalizedEmail = typeof email === 'string' && email.trim().length > 0
            ? email.trim().toLowerCase()
            : 'missing';
        return `ip:${req.ip}:email:${normalizedEmail}`;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const throttler = this.throttlers.find(({ name }) => name === 'auth');
        if (!throttler) return true;

        return this.handleRequest({
            context,
            limit: 10,
            ttl: 300000,
            blockDuration: 300000,
            throttler,
            getTracker: this.getTracker.bind(this),
            generateKey: this.generateKey.bind(this),
        });
    }
}
