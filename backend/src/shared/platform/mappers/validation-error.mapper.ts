import { ValidationError } from 'class-validator';
import { ProblemFieldErrorDto } from '../dto/problem-details.dto';

function constraintCode(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toUpperCase();
}

export function mapValidationErrors(
  validationErrors: ValidationError[],
): ProblemFieldErrorDto[] {
  const mapped: ProblemFieldErrorDto[] = [];

  const visit = (errors: ValidationError[], parent: string): void => {
    for (const error of errors) {
      const field = parent ? `${parent}.${error.property}` : error.property;

      if (error.constraints) {
        for (const [constraint, message] of Object.entries(error.constraints)) {
          mapped.push({ field, code: constraintCode(constraint), message });
        }
      }

      if (error.children?.length) visit(error.children, field);
    }
  };

  visit(validationErrors, '');
  return mapped;
}
