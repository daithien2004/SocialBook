import type { Ability } from '@casl/ability';
import type { PrismaQueryOf, Subjects } from '@casl/prisma/runtime';
import type {
  Prisma,
  ReadingRoom as PrismaReadingRoom,
  ReadingRoomHighlight as PrismaReadingRoomHighlight,
  ReadingRoomMember as PrismaReadingRoomMember,
  Bookmark as PrismaBookmark,
  Book as PrismaBook,
  Genre as PrismaGenre,
  Author as PrismaAuthor,
  User as PrismaUser,
} from '@/core/database/generated/prisma/client';

type ReadingRoomSubject = Pick<PrismaReadingRoom, 'id' | 'hostId' | 'status'>;
type ReadingRoomMemberSubject = Pick<
  PrismaReadingRoomMember,
  'roomId' | 'userId'
>;
type ReadingRoomHighlightSubject = Pick<
  PrismaReadingRoomHighlight,
  'id' | 'roomId' | 'userId'
>;
type BookmarkSubject = Pick<PrismaBookmark, 'id' | 'userId'>;
type BookSubject = Pick<PrismaBook, 'id' | 'status' | 'isDeleted'>;
type GenreSubject = Pick<PrismaGenre, 'id'>;
type AuthorSubject = Pick<PrismaAuthor, 'id'>;
type UserSubject = Pick<PrismaUser, 'id'>;

export type AppAction =
  | 'create' | 'read' | 'update' | 'delete' | 'join' | 'like' | 'manage';

export type AppSubject =
  | 'all'
  | 'ReadingRoom'
  | 'ReadingRoomMember'
  | 'ReadingRoomHighlight'
  | 'Statistics'
  | 'Bookmark'
  | 'Book'
  | 'Genre'
  | 'GenreAdministration'
  | 'Author'
  | 'AuthorAdministration'
  | 'AIRateLimitConfiguration'
  | 'User';

export type AppAbility = Ability<
  [
    AppAction,
    (
      | AppSubject
      | Subjects<{
          ReadingRoom: ReadingRoomSubject;
          ReadingRoomMember: ReadingRoomMemberSubject;
          ReadingRoomHighlight: ReadingRoomHighlightSubject;
          Bookmark: BookmarkSubject;
          Book: BookSubject;
          Genre: GenreSubject;
          Author: AuthorSubject;
          User: UserSubject;
        }>
    ),
  ],
  PrismaQueryOf<Prisma.TypeMap>
>;
