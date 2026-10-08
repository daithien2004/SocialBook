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

  const oauthRedirectPaths = [
    '/api/auth/google',
    '/api/auth/github',
    '/api/auth/google/callback',
    '/api/auth/github/callback',
  ];

  for (const path of oauthRedirectPaths) {
    const pathItem = document.paths[path];
    const operation = pathItem.get;
    if (!operation) continue;

    const responses = operation.responses;
    if (!('302' in responses)) continue;

    const implicitOkResponse = responses['200'];
    if (
      implicitOkResponse &&
      !('content' in implicitOkResponse) &&
      !('headers' in implicitOkResponse)
    ) {
      delete responses['200'];
    }
  }

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    jsonDocumentUrl: '/docs/openApi.json',
  });
};
