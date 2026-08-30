import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ModuleLogger } from './module-logger';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new ModuleLogger('http-errors');

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const body = exception.getResponse();

        const message = typeof body === 'object' && body !== null
            ? (body as any).message ?? JSON.stringify(body)
            : String(body);

        this.logger.warn(`[${req.method}] ${req.url} → ${status} ${exception.name}: ${message}`);

        res.status(status).json({ statusCode: status, message });
    }
}
