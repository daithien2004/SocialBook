import { ToxicWord } from '../entities/toxic-word.entity';

export abstract class IToxicWordRepository {
  abstract create(word: ToxicWord): Promise<ToxicWord>;
  abstract delete(id: string): Promise<boolean>;
  abstract findAll(): Promise<ToxicWord[]>;
  abstract existsByPattern(pattern: string): Promise<boolean>;
}
