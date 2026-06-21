import { Entity } from '@/shared/domain/entity.base';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { RoomId } from '../value-objects/room-id.vo';
import { RoomMode } from '../value-objects/room-mode.vo';
import { RoomMember } from './room-member.entity';
import { DEFAULT_MAX_MEMBERS } from '../enums/constants';

export interface RoomHighlightProps {
  id?: string;
  userId: string;
  chapterSlug: string;
  paragraphId: string;
  content: string;
  aiInsight?: string;
  createdAt?: Date;
}

export interface ChatMessageProps {
  userId: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: Date;
}

export interface ReadingRoomProps {
  bookId: BookId;
  hostId: UserId;
  mode: RoomMode;
  status: 'active' | 'ended';
  currentChapterSlug: string;
  maxMembers: number;
  members: RoomMember[];
  highlights: RoomHighlightProps[];
  chatMessages: ChatMessageProps[];
  endedAt?: Date;
}

export class ReadingRoom extends Entity<RoomId> {
  private _props: ReadingRoomProps;

  private constructor(
    id: RoomId,
    props: ReadingRoomProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: {
    bookId: string;
    hostId: string;
    mode: string;
    maxMembers?: number;
    currentChapterSlug: string;
  }): ReadingRoom {
    const roomId = RoomId.create();
    const mode = RoomMode.create(props.mode);
    const maxMembers = props.maxMembers || DEFAULT_MAX_MEMBERS;

    const hostMember = RoomMember.create({
      userId: props.hostId,
      role: 'host',
    });

    return new ReadingRoom(roomId, {
      bookId: BookId.create(props.bookId),
      hostId: UserId.create(props.hostId),
      mode,
      status: 'active',
      currentChapterSlug: props.currentChapterSlug,
      maxMembers,
      members: [hostMember],
      highlights: [],
      chatMessages: [],
    });
  }

  static reconstitute(props: {
    id: string;
    bookId: string;
    hostId: string;
    mode: string;
    status: 'active' | 'ended';
    currentChapterSlug: string;
    maxMembers: number;
    members: Array<{
      userId: string;
      role: 'host' | 'member';
      joinedAt: Date;
      leftAt?: Date;
    }>;
    highlights: RoomHighlightProps[];
    chatMessages: ChatMessageProps[];
    createdAt: Date;
    updatedAt: Date;
    endedAt?: Date;
  }): ReadingRoom {
    return new ReadingRoom(
      RoomId.create(props.id),
      {
        bookId: BookId.create(props.bookId),
        hostId: UserId.create(props.hostId),
        mode: RoomMode.create(props.mode),
        status: props.status,
        currentChapterSlug: props.currentChapterSlug,
        maxMembers: props.maxMembers,
        members: props.members.map((m) => RoomMember.reconstitute(m)),
        highlights: props.highlights,
        chatMessages: props.chatMessages,
        endedAt: props.endedAt,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  // Getters
  get roomId(): string {
    return this._id.toString();
  }
  get bookId(): string {
    return this._props.bookId.toString();
  }
  get hostId(): string {
    return this._props.hostId.toString();
  }
  get mode(): string {
    return this._props.mode.toString();
  }
  get status(): 'active' | 'ended' {
    return this._props.status;
  }
  get currentChapterSlug(): string {
    return this._props.currentChapterSlug;
  }
  get maxMembers(): number {
    return this._props.maxMembers;
  }
  get members(): RoomMember[] {
    return [...this._props.members];
  }
  get activeMembers(): RoomMember[] {
    return this._props.members.filter((m) => m.isActive);
  }
  get highlights(): RoomHighlightProps[] {
    return [...this._props.highlights];
  }
  get chatMessages(): ChatMessageProps[] {
    return [...this._props.chatMessages];
  }
  get endedAt(): Date | undefined {
    return this._props.endedAt;
  }

  // Business logic
  addHighlight(props: {
    userId: string;
    chapterSlug: string;
    paragraphId: string;
    content: string;
  }): void {
    if (this._props.status === 'ended') {
      throw new BadRequestDomainException('Không thể highlight trong phòng đã kết thúc');
    }

    this._props.highlights.push({
      id: crypto.randomUUID(),
      ...props,
      createdAt: new Date(),
    });
    this.markAsUpdated();
  }

  updateHighlightInsight(highlightIndex: number, insight: string): void {
    if (this._props.highlights[highlightIndex]) {
      this._props.highlights[highlightIndex].aiInsight = insight;
      this.markAsUpdated();
    }
  }

  removeHighlight(highlightId: string, userId: string): void {
    const index = this._props.highlights.findIndex((h) => h.id === highlightId);
    if (index === -1) {
      throw new BadRequestDomainException('Không tìm thấy highlight');
    }
    if (this._props.highlights[index].userId !== userId) {
      throw new BadRequestDomainException(
        'Chỉ chủ sở hữu mới có thể gỡ highlight',
      );
    }
    this._props.highlights.splice(index, 1);
    this.markAsUpdated();
  }

  addChatMessage(props: {
    userId: string;
    role: 'user' | 'ai';
    content: string;
  }): void {
    this._props.chatMessages.push({
      ...props,
      createdAt: new Date(),
    });
    this.markAsUpdated();
  }

  addMember(userId: string): void {
    if (this._props.status === 'ended') {
      throw new BadRequestDomainException('Phòng đã kết thúc');
    }

    if (
      this.activeMembers.length >= this._props.maxMembers &&
      !this.isMember(userId)
    ) {
      throw new BadRequestDomainException('Phòng đã đầy');
    }

    const existingMember = this._props.members.find((m) => m.userId === userId);
    if (existingMember) {
      if (!existingMember.isActive) {
        existingMember.rejoin();
        this.markAsUpdated();
      }
      return;
    }

    this._props.members.push(RoomMember.create({ userId }));
    this.markAsUpdated();
  }

  transferHost(newHostId: string): void {
    const newHost = this._props.members.find(
      (m) => m.userId === newHostId && m.isActive,
    );
    if (!newHost) {
      throw new BadRequestDomainException(
        'Người dùng không phải thành viên đang hoạt động',
      );
    }

    const oldHost = this._props.members.find(
      (m) => m.userId === this.hostId && m.isActive,
    );
    if (oldHost) {
      oldHost.changeRole('member');
    }

    newHost.changeRole('host');
    this._props.hostId = UserId.create(newHostId);
    this.markAsUpdated();
  }

  removeMember(userId: string): void {
    const member = this._props.members.find((m) => m.userId === userId);
    if (member && member.isActive) {
      member.markAsLeft();

      if (member.role === 'host' && this._props.mode.toString() === 'sync') {
        this._props.mode = RoomMode.create('free');
      }

      this.markAsUpdated();
    }
  }

  changeChapter(userId: string, newChapterSlug: string): void {
    if (this._props.status === 'ended') {
      throw new BadRequestDomainException(
        'Không thể đổi chương trong phòng đã kết thúc',
      );
    }

    if (!this.isMember(userId)) {
      throw new BadRequestDomainException('Chỉ thành viên mới được đổi chương');
    }

    // Only host can change chapter in sync mode
    if (this._props.mode.toString() === 'sync' && userId !== this.hostId) {
      throw new BadRequestDomainException(
        'Chỉ chủ phòng mới được đổi chương ở chế độ đồng bộ',
      );
    }

    this._props.currentChapterSlug = newChapterSlug;
    this.markAsUpdated();
  }

  changeMode(userId: string, newMode: string): void {
    if (this._props.status === 'ended') {
      throw new BadRequestDomainException('Không thể đổi chế độ trong phòng đã kết thúc');
    }

    if (userId !== this.hostId) {
      throw new BadRequestDomainException('Chỉ chủ phòng mới được đổi chế độ');
    }

    this._props.mode = RoomMode.create(newMode);
    this.markAsUpdated();
  }

  end(): void {
    if (this._props.status !== 'ended') {
      this._props.status = 'ended';
      this._props.endedAt = new Date();
      this.markAsUpdated();
    }
  }

  isMember(userId: string): boolean {
    return this._props.members.some((m) => m.userId === userId && m.isActive);
  }

  isHost(userId: string): boolean {
    return this.hostId === userId && this.isMember(userId);
  }
}
