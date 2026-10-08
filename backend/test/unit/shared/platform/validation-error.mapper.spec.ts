import { ValidationError } from 'class-validator';
import { mapValidationErrors } from '@/shared/platform/mappers/validation-error.mapper';

describe('mapValidationErrors', () => {
  it('maps nested constraints to dotted field paths and stable codes', () => {
    const titleError = new ValidationError();
    titleError.property = 'title';
    titleError.constraints = { isNotEmpty: 'title should not be empty' };

    const postError = new ValidationError();
    postError.property = 'post';
    postError.children = [titleError];

    expect(mapValidationErrors([postError])).toEqual([
      {
        field: 'post.title',
        code: 'IS_NOT_EMPTY',
        message: 'title should not be empty',
      },
    ]);
  });
});
