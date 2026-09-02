import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
    ThrottlerGuard,
    ThrottlerModuleOptions,
    ThrottlerStorage,
} from '@nestjs/throttler';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class AccountThrottlerGuard extends ThrottlerGuard {
    constructor(
        options: ThrottlerModuleOptions,
        storageService: ThrottlerStorage,
        reflector: Reflector,
    ) {
        super(options, storageService, reflector);
    }

    protected async getTracker(req: Record<string, any>): Promise<string> {
        const account = req.user?.email || 'missing';
        return `ip:${req.ip}:account:${String(account).trim().toLowerCase()}`;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const throttler = this.throttlers.find(({ name }) => name === 'account');
        if (!throttler) return true;

        return this.handleRequest({
            context,
            limit: 500,
            ttl: 300000,
            blockDuration: 300000,
            throttler,
            getTracker: this.getTracker.bind(this),
            generateKey: this.generateKey.bind(this),
        });
    }
}
