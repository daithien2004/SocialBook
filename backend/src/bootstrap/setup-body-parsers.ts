import type { INestApplication } from '@nestjs/common';
import { json, urlencoded } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { isChapterImportStartRequest } from '@/modules/chapters/presentation/public-api';

export function setupBodyParsers(app: INestApplication): void {
  const chapterImportParser = json({ limit: '50mb' });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (isChapterImportStartRequest(req.method, req.path)) {
      chapterImportParser(req, res, next);
      return;
    }

    next();
  });

  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ limit: '1mb', extended: true }));
}
