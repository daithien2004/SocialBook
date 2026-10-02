import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ReadingRoom,
  ReadingRoomDocument,
  RoomMemberSchema,
  RoomHighlight,
} from '@/infrastructure/database/schemas/reading-room.schema';

import {
  Chapter,
  ChapterDocument,
} from '@/infrastructure/database/schemas/chapter.schema';
import {
  Book,
  BookDocument,
} from '@/infrastructure/database/schemas/book.schema';
import {
  User,
  UserDocument,
} from '@/infrastructure/database/schemas/user.schema';

interface RoomConfig {
  code: string;
  book: BookDocument;
  chapter: ChapterDocument;
  mode: string;
  host: UserDocument;
  members: UserDocument[];
}

@Injectable()
export class ReadingRoomsSeed {
  private readonly logger = new Logger(ReadingRoomsSeed.name);

  constructor(
    @InjectModel(ReadingRoom.name)
    private roomModel: Model<ReadingRoomDocument>,

    @InjectModel(Chapter.name)
    private chapterModel: Model<ChapterDocument>,
    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🏠 Seeding reading rooms for demo...');

    await this.roomModel.deleteMany({ _id: /^DEMO/ });

    const users = await this.userModel.find();
    const books = await this.bookModel.find().exec();
    const allChapters = await this.chapterModel
      .find()
      .sort({ orderIndex: 1 })
      .exec();

    if (users.length < 3 || books.length === 0 || allChapters.length === 0) {
      this.logger.error(
        '❌ Not enough data (need >= 3 users, >= 1 book, >= 1 chapter).',
      );
      return;
    }

    const chaptersByBook = new Map<string, ChapterDocument[]>();
    for (const ch of allChapters) {
      const key = ch.bookId.toString();
      if (!chaptersByBook.has(key)) chaptersByBook.set(key, []);
      chaptersByBook.get(key)!.push(ch);
    }

    const getBookChapters = (book: BookDocument): ChapterDocument[] =>
      chaptersByBook.get(book._id.toString()) || [];

    const midIndex = (chapters: ChapterDocument[]) =>
      Math.floor(chapters.length / 2);

    const roomConfigs: RoomConfig[] = [];
    const book0 = books[0];
    const book1 = books.length > 1 ? books[1] : books[0];
    const book2 = books.length > 2 ? books[2] : books[0];
    const book3 = books.length > 3 ? books[3] : books[0];
    const book4 = books.length > 4 ? books[4] : books[0];

    const configs: [number, number, string][] = [
      [0, 0, 'sync'],
      [0, 0, 'free'],
      [1, 0, 'sync'],
      [2, midIndex(getBookChapters(book2)), 'free'],
      [3, getBookChapters(book4).length - 1, 'sync'],
    ];

    for (let i = 0; i < configs.length; i++) {
      const [bookIdx, chIdx, mode] = configs[i];
      const b = [book0, book1, book2, book3, book4][bookIdx];
      const chs = getBookChapters(b);
      if (chs.length === 0 || chIdx >= chs.length) continue;
      const chapter = chs[chIdx];
      const host = users[i % users.length];
      const shuffled = [
        ...users.filter((u) => u._id.toString() !== host._id.toString()),
      ].sort(() => Math.random() - 0.5);
      const members = shuffled.slice(0, 3);

      roomConfigs.push({
        code: `DEMO0${i + 1}`,
        book: b,
        chapter,
        mode,
        host,
        members,
      });
    }

    if (roomConfigs.length === 0) {
      this.logger.error('❌ No room configs could be created.');
      return;
    }

    const highlightTemplates = [
      (c: string) =>
        `Đoạn văn miêu tả thật tinh tế: "${c.substring(0, 80)}..."`,
      (c: string) => `Chi tiết này rất quan trọng: "${c.substring(0, 60)}..."`,
      (c: string) => `Câu văn hay nhất chương: "${c.substring(0, 100)}..."`,
    ];

    for (const rc of roomConfigs) {
      const roomId = rc.code;
      const paragraphs = (rc.chapter.paragraphs || []) as {
        _id: Types.ObjectId;
        content: string;
      }[];
      const paraIds = paragraphs.map((p) => p._id.toString());
      const paraContents = paragraphs.map((p) => p.content);

      const hostId = rc.host._id.toString();
      const allUserIds = [hostId, ...rc.members.map((m) => m._id.toString())];

      const members: RoomMemberSchema[] = allUserIds.map((uid, idx) => ({
        userId: uid,
        role: idx === 0 ? ('host' as const) : ('member' as const),
        joinedAt: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        ),
      }));

      const highlights: RoomHighlight[] = [];
      const highlightCount = Math.min(3, paraIds.length);
      for (let i = 0; i < highlightCount; i++) {
        const pid = paraIds[i];
        const content = paraContents[i] || '';
        const pick = highlightTemplates[i % highlightTemplates.length];
        highlights.push({
          id: `${roomId}-hl-${i + 1}`,
          userId: allUserIds[Math.floor(Math.random() * allUserIds.length)],
          chapterSlug: rc.chapter.slug,
          paragraphId: pid,
          content: pick(content),
          createdAt: new Date(
            Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000,
          ),
        });
      }

      await this.roomModel.create({
        _id: roomId,
        bookId: rc.book._id.toString(),
        hostId,
        mode: rc.mode,
        status: 'active',
        currentChapterSlug: rc.chapter.slug,
        maxMembers: 10,
        members,
        highlights,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      });
    }

    this.logger.log(`✅ Seeded ${roomConfigs.length} reading rooms`);
  }
}
