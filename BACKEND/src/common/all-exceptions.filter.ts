import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ModuleLogger } from './module-logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new ModuleLogger('system-errors');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();

        const message = exception instanceof Error ? exception.message : 'Internal server error';
        this.logger.error(`[${req.method}] ${req.url} → 500 Unhandled: ${message}`, exception instanceof Error ? exception.stack : undefined);

        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
        });
    }
}
