import { DomainEvent } from '@/shared/domain/domain-event';
import { Empty__Name__TitleError } from '../errors/__kebab__.errors';
import { __Name__CreatedEvent } from '../events/__kebab__-created.event';

export interface __Name__Props {
  id: string;
  ownerId: string;
  title: string;
  createdAt: Date;
}

export class __Name__ {
  private readonly _events: DomainEvent[] = [];

  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _title: string,
    readonly createdAt: Date,
  ) {}

  static create(p: { id: string; ownerId: string; title: string }): __Name__ {
    const title = p.title.trim();
    if (!title) throw new Empty__Name__TitleError();
    const entity = new __Name__(p.id, p.ownerId, title, new Date());
    entity._events.push(new __Name__CreatedEvent(entity.id, entity.ownerId));
    return entity;
  }

  static rehydrate(p: __Name__Props): __Name__ {
    return new __Name__(p.id, p.ownerId, p.title, p.createdAt);
  }

  get title(): string {
    return this._title;
  }

  rename(title: string): void {
    const next = title.trim();
    if (!next) throw new Empty__Name__TitleError();
    this._title = next;
  }

  // Handler gọi sau khi lưu để lấy event cần publish; mỗi event chỉ lấy một lần.
  pullEvents(): DomainEvent[] {
    return this._events.splice(0);
  }
}
