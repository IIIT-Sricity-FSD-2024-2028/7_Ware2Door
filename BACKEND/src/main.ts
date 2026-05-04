import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
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
Protected endpoints require an **\`x-role\`** header specifying the caller's role.

Click the **Authorize 🔒** button, then enter one of the allowed values:

| Role Value | Access |
|---|---|
| \`WAREHOUSE\` | Warehouse management endpoints |
| \`TRANSIT_HUB\` | Transit hub scan & reports endpoints |
| \`LOCAL_AGENCY\` | Agency delivery & agent endpoints |
| \`SUPER_USER\` | Full administrative access |

> **Public endpoints** (login, verify-email, track, raise-ticket) do **not** require this header.`
        )
        .setVersion('1.0')
        .addApiKey(
            {
                type: 'apiKey',
                name: 'x-role',
                in: 'header',
                description: 'Role-based access header. Allowed values: WAREHOUSE | TRANSIT_HUB | LOCAL_AGENCY | SUPER_USER',
            },
            'x-role',
        )
        .addSecurityRequirements('x-role')
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
    console.log(`🚀 Server running on http://localhost:8000`);
    console.log(`📖 Swagger docs available at http://localhost:8000/api/docs`);
}

bootstrap();