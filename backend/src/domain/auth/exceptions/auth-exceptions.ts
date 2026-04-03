import { DomainException } from '@/shared/domain/domain-exception.base';

export class UnauthorizedDomainException extends DomainException {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class UserBannedDomainException extends DomainException {
  constructor(message: string = 'Tài khoản đã bị vô hiệu hóa') {
    super(message, 'USER_BANNED', 403);
  }
}

export class InvalidCredentialsDomainException extends DomainException {
  constructor(message: string = 'Thông tin đăng nhập không chính xác') {
    super(message, 'INVALID_CREDENTIALS', 401);
  }
}
