import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let secret = req.cookies['sb_csrf_secret'];
    if (!secret) {
      secret = crypto.randomBytes(32).toString('hex');
      res.cookie('sb_csrf_secret', secret, {
        httpOnly: true, // Không cho JS đọc secret này
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    // Hash secret thành token để JS đọc
    const token = crypto
      .createHmac('sha256', process.env.JWT_ACCESS_SECRET || 'fallback_secret')
      .update(secret)
      .digest('hex');

    res.cookie('sb_csrf_token', token, {
      httpOnly: false, // Frontend JS đọc được token này
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    next();
  }
}
