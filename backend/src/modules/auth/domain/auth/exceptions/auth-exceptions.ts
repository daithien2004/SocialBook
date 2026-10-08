import { DomainException } from '@/shared/domain/domain-exception.base';
import { ErrorCode } from '@/shared/domain/error-codes';

export class UnauthorizedDomainException extends DomainException {
  constructor(message: string = 'Unauthorized') {
    super(ErrorCode.UNAUTHORIZED, message);
  }
}

export class UserBannedDomainException extends DomainException {
  constructor(message: string = 'Tài khoản đã bị vô hiệu hóa') {
    super(ErrorCode.FORBIDDEN, message);
  }
}

export class InvalidCredentialsDomainException extends DomainException {
  constructor(message: string = 'Thông tin đăng nhập không chính xác') {
    super(ErrorCode.UNAUTHORIZED, message);
  }
}
