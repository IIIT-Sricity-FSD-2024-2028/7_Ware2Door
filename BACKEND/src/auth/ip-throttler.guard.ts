import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        return req.ip;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (await this.shouldSkip(context)) return true;

        const throttler = this.throttlers.find(({ name }) => name === 'authIp');
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
