import {
  ArgumentMetadata,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import {
  ValidationException,
  ValidationIssue,
} from '@/shared/domain/common-exceptions';

const flatten = (errors: ValidationError[], parent = ''): ValidationIssue[] =>
  errors.flatMap((e) => {
    const field = parent ? `${parent}.${e.property}` : e.property;
    const own = e.constraints
      ? [{ field, constraints: Object.keys(e.constraints) }]
      : [];
    return [...own, ...flatten(e.children ?? [], field)];
  });

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export class WsValidationPipe extends ValidationPipe {
  constructor(options?: any) {
    super({
      ...options,
      exceptionFactory: (errors) => new ValidationException(flatten(errors)),
    });
  }

  override async transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') return value;
    if (!isPlainObject(value)) {
      throw new ValidationException([
        { field: 'body', constraints: ['isObject'] },
      ]);
    }
    return super.transform(value, metadata);
  }
}
