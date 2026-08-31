import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import cookieParser = require('cookie-parser');
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
    app.use(cookieParser());
    app.use(helmet({ contentSecurityPolicy: false }));
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
            const firstError = errors[0];
            const message = firstError.constraints ? Object.values(firstError.constraints)[0] : 'Validation failed';
            return new BadRequestException({ error: message, message: message });
        }
    }));

    const config = new DocumentBuilder()
        .setTitle('WARE2DOOR API')
        .setDescription(
            `## WARE2DOOR Logistics API

End-to-end logistics platform covering warehouse management, transit hub scanning, last-mile delivery, RTO lifecycle, and super-user administration.

### Authentication
Protected endpoints require a valid JWT session cookie (\`w2d_token\`), set automatically on login.

**Public endpoints** (login, verify-email, track, raise-ticket) do **not** require authentication.`
        )
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
        customSiteTitle: 'WARE2DOOR API Docs',
        customCss: `
            .swagger-ui .topbar { background: linear-gradient(135deg, #1e3a5f 0%, #0f2340 100%); }
            .swagger-ui .topbar .topbar-wrapper .link::before { content: '🚚 WARE2DOOR API'; color: white; font-size: 18px; font-weight: bold; }
            .swagger-ui .topbar img { display: none; }
            .swagger-ui .info .title { color: #1e3a5f; }
        `,
    });

    const docsPath = path.join(__dirname, '..', 'docs');
    if (!fs.existsSync(docsPath)) {
        fs.mkdirSync(docsPath, { recursive: true });
    }
    fs.writeFileSync(path.join(docsPath, 'swagger.json'), JSON.stringify(document, null, 2));

    await app.listen(8000);
    const log = new Logger('Bootstrap');
    log.log('Server running on http://localhost:8000');
    log.log('Swagger docs available at http://localhost:8000/api/docs');
}

bootstrap();