import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const configSwagger = (app: INestApplication) => {
    const config = new DocumentBuilder()
        .setTitle('SocialBook API')
        .setDescription('The SocialBook API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
        jsonDocumentUrl: '/api/openApi.json',
    });
};
