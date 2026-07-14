import { Entity } from '@/shared/domain/entity.base';

export interface ToxicWordProps {
  pattern: string;
  group: string; // 'thô tục mạnh', 'xúc phạm', etc.
  originalWord: string;
}

export class ToxicWord extends Entity<string> {
  private _props: ToxicWordProps;

  private constructor(
    id: string,
    props: ToxicWordProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: {
    id: string;
    pattern: string;
    group: string;
    originalWord: string;
  }): ToxicWord {
    return new ToxicWord(props.id, {
      pattern: props.pattern,
      group: props.group,
      originalWord: props.originalWord,
    });
  }

  static reconstitute(props: {
    id: string;
    pattern: string;
    group: string;
    originalWord: string;
    createdAt: Date;
    updatedAt: Date;
  }): ToxicWord {
    return new ToxicWord(
      props.id,
      {
        pattern: props.pattern,
        group: props.group,
        originalWord: props.originalWord,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  get pattern(): string {
    return this._props.pattern;
  }

  get group(): string {
    return this._props.group;
  }

  get originalWord(): string | undefined {
    return this._props.originalWord;
  }
}
