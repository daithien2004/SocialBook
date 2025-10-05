import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(errors: string[]) {
    super(
      {
        message: errors,
        error: 'Validation Error',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
