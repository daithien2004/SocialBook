import { Identifier } from '@/shared/domain/identifier.base';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';

export type ReactionTypeValue =
  | 'cry'
  | 'angry'
  | 'laugh'
  | 'think'
  | 'shock'
  | 'heart'
  | 'fire'
  | 'calm';

export const REACTION_TYPES: ReactionTypeValue[] = [
  'cry',
  'angry',
  'laugh',
  'think',
  'shock',
  'heart',
  'fire',
  'calm',
];

export const REACTION_META: Record<
  ReactionTypeValue,
  { emoji: string; label: string }
> = {
  cry: { emoji: '😢', label: 'Buồn' },
  angry: { emoji: '😡', label: 'Tức' },
  laugh: { emoji: '😂', label: 'Cười' },
  think: { emoji: '🤔', label: 'Suy nghĩ' },
  shock: { emoji: '😮', label: 'Bất ngờ' },
  heart: { emoji: '❤️', label: 'Yêu thích' },
  fire: { emoji: '🔥', label: 'Đỉnh' },
  calm: { emoji: '😌', label: 'Nhẹ nhàng' },
};

export class ReactionType extends Identifier {
  private constructor(value: ReactionTypeValue) {
    super(value);
  }

  static create(value: string): ReactionType {
    if (!this.isValid(value)) {
      throw new BadRequestDomainException(`Invalid reaction type: ${value}`);
    }
    return new ReactionType(value as ReactionTypeValue);
  }

  static isValid(value: string): boolean {
    return REACTION_TYPES.includes(value as ReactionTypeValue);
  }

  get emoji(): string {
    return REACTION_META[this.getValue() as ReactionTypeValue].emoji;
  }

  get label(): string {
    return REACTION_META[this.getValue() as ReactionTypeValue].label;
  }
}
