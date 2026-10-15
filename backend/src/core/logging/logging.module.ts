import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        genReqId: (request, response) => {
          const header = request.headers['x-request-id'];
          const requestId =
            typeof header === 'string' && /^[a-zA-Z0-9._-]{1,128}$/.test(header)
              ? header
              : randomUUID();
          response.setHeader('x-request-id', requestId);
          return requestId;
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-csrf-token"]',
            'req.body.password',
            'req.body.refreshToken',
            'req.body.accessToken',
            'req.body.token',
          ],
          remove: true,
        },
        ...(process.env.NODE_ENV !== 'production'
          ? {
              transport: {
                target: 'pino-pretty',
                options: { colorize: true },
              },
            }
          : {}),
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggingModule {}
