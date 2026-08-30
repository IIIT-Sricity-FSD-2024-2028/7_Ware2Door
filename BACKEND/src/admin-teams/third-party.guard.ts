import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const TIERS: Record<string, number> = {
    Starter: 100,
    Growth: 500,
    Business: 2000,
    Enterprise: 10000,
};

@Injectable()
export class ThirdPartyGuard implements CanActivate {
    private filePath = join(process.cwd(), 'src', 'admin-teams', 'third-parties.json');

    private async readJson(): Promise<any> {
        const raw = await readFile(this.filePath, 'utf-8').catch(() => '{"partners":[]}');
        return JSON.parse(raw);
    }

    private async writeJson(data: any): Promise<void> {
        await writeFile(this.filePath, JSON.stringify(data, null, 2));
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'] as string;

        if (!apiKey) {
            throw new UnauthorizedException(
                'Missing x-api-key header. Third party API access requires a valid API key.',
            );
        }

        const data = await this.readJson();
        const partner = (data.partners || []).find((p: any) => p.apiKey === apiKey);

        if (!partner) {
            throw new UnauthorizedException(
                'Invalid API key. Partner not found in the Ware2Door network.',
            );
        }

        if (!partner.isActive) {
            throw new UnauthorizedException(
                `Partner account "${partner.name}" is currently deactivated. Contact Admin Teams.`,
            );
        }

        const currentMonth = new Date().toISOString().slice(0, 7);
        if (partner.usageResetMonth !== currentMonth) {
            partner.usageResetMonth = currentMonth;
            partner.currentMonthUsage = 0;
        }
        const maxAllowed = partner.tierLimits?.maxShipmentsPerMonth
            ?? TIERS[partner.tier]
            ?? 100;

        if (partner.currentMonthUsage >= maxAllowed) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: `Monthly shipment quota exceeded for "${partner.name}". `
                        + `Tier: ${partner.tier} — Limit: ${maxAllowed}/month. `
                        + `Contact support team for an extension.`,
                    tier: partner.tier,
                    limit: maxAllowed,
                    used: partner.currentMonthUsage,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }
        partner.currentMonthUsage += 1;
        await this.writeJson(data);

        request.thirdParty = {
            id: partner.id,
            name: partner.name,
            tier: partner.tier,
        };

        return true;
    }
}
