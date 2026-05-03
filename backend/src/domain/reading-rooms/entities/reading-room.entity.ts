import { Entity } from '@/shared/domain/entity.base';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { RoomId } from '../value-objects/room-id.vo';
import { RoomMode } from '../value-objects/room-mode.vo';
import { RoomMember } from './room-member.entity';
import { DEFAULT_MAX_MEMBERS } from '../constants';

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
    
    const hostMember = RoomMember.create({ userId: props.hostId, role: 'host' });

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
    members: Array<{ userId: string; role: 'host' | 'member'; joinedAt: Date; leftAt?: Date }>;
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
        members: props.members.map(m => RoomMember.reconstitute(m)),
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
    return this._props.members.filter(m => m.isActive);
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
      throw new BadRequestDomainException('Cannot highlight in ended room');
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
      throw new BadRequestDomainException('Cannot join ended room');
    }
    
    if (this.activeMembers.length >= this._props.maxMembers && !this.isMember(userId)) {
      throw new BadRequestDomainException('Room is full');
    }

    const existingMember = this._props.members.find(m => m.userId === userId);
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

  removeMember(userId: string): void {
    const member = this._props.members.find(m => m.userId === userId);
    if (member && member.isActive) {
      member.markAsLeft();
      
      // If host leaves, try to transfer host
      if (member.role === 'host') {
        this.transferHost();
      }
      
      this.markAsUpdated();
    }
  }

  changeChapter(userId: string, newChapterSlug: string): void {
    if (this._props.status === 'ended') {
      throw new BadRequestDomainException('Cannot change chapter in ended room');
    }

    if (!this.isMember(userId)) {
      throw new BadRequestDomainException('Only members can change chapter');
    }

    // Only host can change chapter in sync mode
    if (this._props.mode.toString() === 'sync' && userId !== this.hostId) {
      throw new BadRequestDomainException('Only host can change chapter in sync mode');
    }

    this._props.currentChapterSlug = newChapterSlug;
    this.markAsUpdated();
  }

  changeMode(userId: string, newMode: string): void {
    if (this._props.status === 'ended') {
      throw new BadRequestDomainException('Cannot change mode in ended room');
    }

    if (userId !== this.hostId) {
      throw new BadRequestDomainException('Only host can change room mode');
    }

    this._props.mode = RoomMode.create(newMode);
    this.markAsUpdated();
  }

  private transferHost(): void {
    const activeMembers = this.activeMembers;
    if (activeMembers.length > 0) {
      activeMembers.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
      const newHost = activeMembers[0];
      newHost.makeHost();
      this._props.hostId = UserId.create(newHost.userId);
      
      this._props.members.forEach(m => {
        if (m.userId !== newHost.userId && m.role === 'host') {
           m.makeMember();
        }
      });
    }
  }

  end(): void {
    if (this._props.status !== 'ended') {
      this._props.status = 'ended';
      this._props.endedAt = new Date();
      this.markAsUpdated();
    }
  }

  isMember(userId: string): boolean {
    return this._props.members.some(m => m.userId === userId && m.isActive);
  }
  
  isHost(userId: string): boolean {
    return this.hostId === userId && this.isMember(userId);
  }
}
