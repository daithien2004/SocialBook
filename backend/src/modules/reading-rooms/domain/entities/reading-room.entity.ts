import { Entity } from '@/shared/domain/entity.base';
import {
  ReadingRoomInvalidError,
  ReadingRoomFullError,
} from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { InternalServerDomainException } from '@/shared/domain/common-exceptions';
import { RoomId } from '../value-objects/room-id.vo';
import { RoomMode } from '../value-objects/room-mode.vo';
import type { RoomModeType } from '../value-objects/room-mode.vo';
import { RoomMember } from './room-member.entity';
import { DEFAULT_MAX_MEMBERS } from '../constants/reading-room.constants';

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

export interface ReadingRoomProps {
  bookId: string;
  currentChapterId: string;
  hostId: string;
  mode: RoomMode;
  status: ReadingRoomStatus;
  currentChapterSlug: string;
  maxMembers: number;
  members: RoomMember[];
  highlights: RoomHighlightProps[];
  endedAt?: Date;
  version: number;
}

export type ReadingRoomStatus = 'active' | 'ended';

export class ReadingRoom extends Entity<RoomId> {
  private _props: ReadingRoomProps;
  private _loadedVersion = 0;
  private _isNew = true;
  private _dirty = false;
  private readonly _changedMemberIds = new Set<string>();
  private readonly _addedHighlightIds = new Set<string>();
  private readonly _removedHighlightIds = new Set<string>();

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
    currentChapterId: string;
    hostId: string;
    mode: string;
    maxMembers?: number;
    currentChapterSlug: string;
  }): ReadingRoom {
    const roomId = RoomId.create();
    const mode = RoomMode.create(props.mode);
    const maxMembers = props.maxMembers ?? DEFAULT_MAX_MEMBERS;
    if (!Number.isInteger(maxMembers) || maxMembers < 2 || maxMembers > 50) {
      throw new ReadingRoomInvalidError(
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
        bookId: props.bookId,
        currentChapterId: props.currentChapterId,
        hostId: props.hostId,
        mode,
        status: 'active',
        currentChapterSlug: props.currentChapterSlug,
        maxMembers,
        members: [hostMember],
        highlights: [],
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
    currentChapterId: string;
    hostId: string;
    mode: string;
    status: ReadingRoomStatus;
    currentChapterSlug: string;
    maxMembers: number;
    members: Array<{
      userId: string;
      role: 'host' | 'member';
      joinedAt: Date;
      leftAt?: Date;
    }>;
    highlights: RoomHighlightProps[];
    createdAt: Date;
    updatedAt: Date;
    endedAt?: Date;
    version: number;
  }): ReadingRoom {
    const loadedVer = props.version;
    return new ReadingRoom(
      RoomId.create(props.id),
      {
        bookId: props.bookId,
        currentChapterId: props.currentChapterId,
        hostId: props.hostId,
        mode: RoomMode.create(props.mode),
        status: props.status,
        currentChapterSlug: props.currentChapterSlug,
        maxMembers: props.maxMembers,
        members: props.members.map((m) => RoomMember.reconstitute(m)),
        highlights: props.highlights,
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
    return this._props.bookId;
  }
  get currentChapterId(): string {
    return this._props.currentChapterId;
  }
  get hostId(): string {
    return this._props.hostId;
  }
  get mode(): RoomModeType {
    return this._props.mode.modeType;
  }
  get status(): ReadingRoomStatus {
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
  get changedMemberIds(): string[] {
    return [...this._changedMemberIds];
  }
  get addedHighlightIds(): string[] {
    return [...this._addedHighlightIds];
  }
  get removedHighlightIds(): string[] {
    return [...this._removedHighlightIds];
  }

  markPersisted(version: number): void {
    this._loadedVersion = version;
    this._props.version = version;
    this._isNew = false;
    this._dirty = false;
    this._changedMemberIds.clear();
    this._addedHighlightIds.clear();
    this._removedHighlightIds.clear();
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
  }): RoomHighlightProps & { id: string; createdAt: Date } {
    if (this._props.status === 'ended') {
      throw new ReadingRoomInvalidError(
        'Không thể highlight trong phòng đã kết thúc',
      );
    }

    const trimmedContent = (props.content || '').trim();
    if (!trimmedContent || trimmedContent.length > 1000) {
      throw new ReadingRoomInvalidError(
        'Nội dung highlight phải từ 1 đến 1000 ký tự',
      );
    }

    if (!props.paragraphId || props.paragraphId.length > 100) {
      throw new ReadingRoomInvalidError(
        'paragraphId không hợp lệ (tối đa 100 ký tự)',
      );
    }

    if (!/^[a-z0-9-]{1,200}$/.test(props.chapterSlug)) {
      throw new ReadingRoomInvalidError('chapterSlug không hợp lệ');
    }

    if (this._props.highlights.length >= 500) {
      throw new ReadingRoomInvalidError(
        'Phòng đọc đã đạt giới hạn tối đa 500 highlight',
      );
    }

    const userHighlightCount = this._props.highlights.filter(
      (h) => h.userId === props.userId,
    ).length;
    if (userHighlightCount >= 100) {
      throw new ReadingRoomInvalidError(
        'Bạn đã đạt giới hạn tối đa 100 highlight trong phòng này',
      );
    }

    const highlight: RoomHighlightProps & { id: string; createdAt: Date } = {
      id: crypto.randomUUID(),
      userId: props.userId,
      displayName: props.displayName,
      avatarUrl: props.avatarUrl,
      chapterSlug: props.chapterSlug,
      paragraphId: props.paragraphId,
      content: trimmedContent,
      createdAt: new Date(),
    };
    this._props.highlights.push(highlight);
    this._addedHighlightIds.add(highlight.id);
    this.markAsUpdated();
    return { ...highlight };
  }

  removeHighlight(highlightId: string): void {
    const index = this._props.highlights.findIndex((h) => h.id === highlightId);
    if (index === -1) {
      throw new ReadingRoomInvalidError('Không tìm thấy highlight');
    }
    if (this._props.highlights[index].id) {
      const highlightId = this._props.highlights[index].id;
      if (!this._addedHighlightIds.delete(highlightId)) {
        this._removedHighlightIds.add(highlightId);
      }
    }
    this._props.highlights.splice(index, 1);
    this.markAsUpdated();
  }

  addMember(userId: string): void {
    if (this._props.status === 'ended') {
      throw new ReadingRoomInvalidError('Phòng đã kết thúc');
    }

    if (
      this.activeMembers.length >= this._props.maxMembers &&
      !this.isMember(userId)
    ) {
      throw new ReadingRoomFullError('Phòng đã đầy');
    }

    const existingMember = this._props.members.find((m) => m.userId === userId);
    if (existingMember) {
      if (!existingMember.isActive) {
        existingMember.rejoin();
        this._changedMemberIds.add(existingMember.userId);
        this.markAsUpdated();
      }
      return;
    }

    this._props.members.push(RoomMember.create({ userId }));
    this._changedMemberIds.add(userId);
    this.markAsUpdated();
  }

  transferHost(newHostId: string): void {
    if (this.hostId === newHostId) {
      throw new ReadingRoomInvalidError(
        'Không thể chuyển quyền cho chính mình',
      );
    }

    const newHost = this._props.members.find(
      (m) => m.userId === newHostId && m.isActive,
    );
    if (!newHost) {
      throw new ReadingRoomInvalidError(
        'Người nhận quyền không phải thành viên đang hoạt động',
      );
    }

    const oldHost = this._props.members.find(
      (m) => m.userId === this.hostId && m.isActive,
    );
    if (oldHost) {
      oldHost.changeRole('member');
      this._changedMemberIds.add(oldHost.userId);
    }

    newHost.changeRole('host');
    this._changedMemberIds.add(newHost.userId);
    this._props.hostId = newHostId;
    this.markAsUpdated();
  }

  removeMember(userId: string): void {
    const member = this._props.members.find((m) => m.userId === userId);
    if (member && member.isActive) {
      member.markAsLeft();
      this._changedMemberIds.add(member.userId);

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
          this._changedMemberIds.add(nextHost.userId);
          this._props.hostId = nextHost.userId;

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

  end(): void {
    if (this._props.status !== 'ended') {
      this._props.status = 'ended';
      this._props.endedAt = new Date();
      this.markAsUpdated();
    }
  }

  reactivate(): void {
    const hostMember = this._props.members.find(
      (member) => member.userId === this.hostId,
    );
    if (!hostMember) {
      throw new InternalServerDomainException(
        'Reading room host membership is missing',
      );
    }

    if (this._props.status === 'active') {
      return;
    }

    if (!hostMember.isActive) {
      hostMember.rejoin();
    }
    hostMember.changeRole('host');
    this._changedMemberIds.add(hostMember.userId);

    this._props.status = 'active';
    this._props.endedAt = undefined;
    this.markAsUpdated();
  }

  isMember(userId: string): boolean {
    return this._props.members.some((m) => m.userId === userId && m.isActive);
  }

  isHost(userId: string): boolean {
    return this.hostId === userId && this.isMember(userId);
  }
}
