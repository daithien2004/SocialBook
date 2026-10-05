import { Entity } from '@/shared/domain/entity.base';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
  RoomFullDomainException,
} from '@/shared/domain/common-exceptions';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { RoomId } from '../value-objects/room-id.vo';
import { RoomMode } from '../value-objects/room-mode.vo';
import { RoomMember } from './room-member.entity';
import { DEFAULT_MAX_MEMBERS } from '../enums/constants';

export interface RoomHighlightProps {
  id?: string;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
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
  version: number;
}

export class ReadingRoom extends Entity<RoomId> {
  private _props: ReadingRoomProps;
  private _loadedVersion = 0;
  private _isNew = true;
  private _dirty = false;

  private constructor(
    id: RoomId,
    props: ReadingRoomProps,
    createdAt?: Date,
    updatedAt?: Date,
    isNew = true,
    loadedVersion = 0,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
    this._isNew = isNew;
    this._loadedVersion = loadedVersion;
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
    const maxMembers = props.maxMembers ?? DEFAULT_MAX_MEMBERS;
    if (!Number.isInteger(maxMembers) || maxMembers < 2 || maxMembers > 50) {
      throw new BadRequestDomainException(
        'Số lượng thành viên tối đa phải là số nguyên từ 2 đến 50',
      );
    }

    const hostMember = RoomMember.create({
      userId: props.hostId,
      role: 'host',
    });

    return new ReadingRoom(
      roomId,
      {
        bookId: BookId.create(props.bookId),
        hostId: UserId.create(props.hostId),
        mode,
        status: 'active',
        currentChapterSlug: props.currentChapterSlug,
        maxMembers,
        members: [hostMember],
        highlights: [],
        chatMessages: [],
        version: 0,
      },
      undefined,
      undefined,
      true,
      0,
    );
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
    version: number;
  }): ReadingRoom {
    const loadedVer = props.version ?? 0;
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
        version: loadedVer,
      },
      props.createdAt,
      props.updatedAt,
      false,
      loadedVer,
    );
  }

  // Getters
  get roomId(): string {
    return this.id.toString();
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
  get loadedVersion(): number {
    return this._loadedVersion;
  }
  get isNew(): boolean {
    return this._isNew;
  }
  get isDirty(): boolean {
    return this._dirty;
  }
  get version(): number {
    return this._loadedVersion;
  }

  markPersisted(): void {
    this._loadedVersion += 1;
    this._props.version = this._loadedVersion;
    this._isNew = false;
    this._dirty = false;
  }

  protected override markAsUpdated(): void {
    super.markAsUpdated();
    this._dirty = true;
  }

  // Business logic
  addHighlight(props: {
    userId: string;
    displayName?: string;
    avatarUrl?: string;
    chapterSlug: string;
    paragraphId: string;
    content: string;
  }): void {
    if (this._props.status === 'ended') {
      throw new BadRequestDomainException(
        'Không thể highlight trong phòng đã kết thúc',
      );
    }

    const trimmedContent = (props.content || '').trim();
    if (!trimmedContent || trimmedContent.length > 1000) {
      throw new BadRequestDomainException(
        'Nội dung highlight phải từ 1 đến 1000 ký tự',
      );
    }

    if (!props.paragraphId || props.paragraphId.length > 100) {
      throw new BadRequestDomainException(
        'paragraphId không hợp lệ (tối đa 100 ký tự)',
      );
    }

    if (!/^[a-z0-9-]{1,200}$/.test(props.chapterSlug)) {
      throw new BadRequestDomainException('chapterSlug không hợp lệ');
    }

    if (this._props.highlights.length >= 500) {
      throw new BadRequestDomainException(
        'Phòng đọc đã đạt giới hạn tối đa 500 highlight',
      );
    }

    const userHighlightCount = this._props.highlights.filter(
      (h) => h.userId === props.userId,
    ).length;
    if (userHighlightCount >= 100) {
      throw new BadRequestDomainException(
        'Bạn đã đạt giới hạn tối đa 100 highlight trong phòng này',
      );
    }

    this._props.highlights.push({
      id: crypto.randomUUID(),
      userId: props.userId,
      displayName: props.displayName,
      avatarUrl: props.avatarUrl,
      chapterSlug: props.chapterSlug,
      paragraphId: props.paragraphId,
      content: trimmedContent,
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
      throw new RoomFullDomainException('Phòng đã đầy');
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

  transferHost(callerId: string, newHostId: string): void {
    if (callerId !== this.hostId) {
      throw new ForbiddenDomainException(
        'Chỉ chủ phòng mới được chỉ định chủ phòng mới',
      );
    }
    if (callerId === newHostId) {
      throw new BadRequestDomainException(
        'Không thể chuyển quyền cho chính mình',
      );
    }

    const newHost = this._props.members.find(
      (m) => m.userId === newHostId && m.isActive,
    );
    if (!newHost) {
      throw new BadRequestDomainException(
        'Người nhận quyền không phải thành viên đang hoạt động',
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

      if (userId === this.hostId) {
        if (member.role === 'host') {
          member.changeRole('member');
        }

        const remainingMembers = this.activeMembers.sort(
          (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime(),
        );

        if (remainingMembers.length > 0) {
          const nextHost = remainingMembers[0];
          nextHost.changeRole('host');
          this._props.hostId = UserId.create(nextHost.userId);

          if (this._props.mode.toString() === 'sync') {
            this._props.mode = RoomMode.create('free');
          }
        } else {
          this.end();
        }
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
      throw new BadRequestDomainException(
        'Không thể đổi chế độ trong phòng đã kết thúc',
      );
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

  reactivate(userId: string): void {
    if (this._props.status !== 'ended') {
      throw new BadRequestDomainException('Phòng chưa kết thúc');
    }

    if (this.hostId !== userId) {
      throw new ForbiddenDomainException(
        'Chỉ chủ phòng mới có thể mở lại phòng',
      );
    }

    this._props.status = 'active';
    this._props.endedAt = undefined;

    const hostMember = this._props.members.find((m) => m.userId === userId);
    if (hostMember && !hostMember.isActive) {
      hostMember.rejoin();
      hostMember.changeRole('host');
    }

    this.markAsUpdated();
  }

  isMember(userId: string): boolean {
    return this._props.members.some((m) => m.userId === userId && m.isActive);
  }

  isHost(userId: string): boolean {
    return this.hostId === userId && this.isMember(userId);
  }
}
