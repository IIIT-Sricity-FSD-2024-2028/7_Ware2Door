import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { join } from 'path';
import * as fs from 'fs';

const logsDir = join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const { combine, timestamp, printf } = winston.format;

const lineFormat = printf(({ level, message, timestamp }) =>
    `[${timestamp}] [${level.toUpperCase()}] ${message}`
);

function createFileLogger(module: string): winston.Logger {
    return winston.createLogger({
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), lineFormat),
        transports: [
            new winston.transports.File({
                filename: join(logsDir, `${module}.log`),
                level: 'debug',
            }),
            new winston.transports.File({
                filename: join(logsDir, 'errors.log'),
                level: 'error',
            }),
        ],
    });
}

export class ModuleLogger implements LoggerService {
    private readonly winston: winston.Logger;
    private readonly context: string;

    constructor(module: string) {
        this.context = module;
        this.winston = createFileLogger(module);
    }

    log(message: string) {
        this.winston.info(`[${this.context}] ${message}`);
    }

    warn(message: string) {
        this.winston.warn(`[${this.context}] ${message}`);
    }

    error(message: string, trace?: string) {
        this.winston.error(`[${this.context}] ${message}${trace ? `\n${trace}` : ''}`);
    }

    debug(message: string) {
        this.winston.debug(`[${this.context}] ${message}`);
    }

    verbose(message: string) {
        this.winston.verbose(`[${this.context}] ${message}`);
    }
}
