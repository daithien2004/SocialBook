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
  Review as PrismaReview,
  Comment as PrismaComment,
  Chapter as PrismaChapter,
  Post as PrismaPost,
  Like as PrismaLike,
  AIRequest as PrismaAIRequest,
  Notification as PrismaNotification,
  Follow as PrismaFollow,
  UserHighlight as PrismaUserHighlight,
  TextToSpeech as PrismaTextToSpeech,
  LibraryCollection as PrismaCollection,
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
type ReviewSubject = Pick<PrismaReview, 'id' | 'userId' | 'moderationStatus'>;
type CommentSubject = Pick<
  PrismaComment,
  'userId' | 'moderationStatus' | 'isDeleted'
>;
type ChapterSubject = Pick<PrismaChapter, 'id' | 'bookId' | 'isDeleted'>;
type PostSubject = Pick<
  PrismaPost,
  'id' | 'userId' | 'isDeleted' | 'isFlagged'
>;
type LikeSubject = Pick<
  PrismaLike,
  'id' | 'userId' | 'targetId' | 'targetType'
>;
type AIRequestSubject = Pick<PrismaAIRequest, 'id' | 'userId'>;
type NotificationSubject = Pick<PrismaNotification, 'id' | 'userId'>;
type FollowSubject = Pick<PrismaFollow, 'id' | 'userId' | 'targetId'>;
type UserHighlightSubject = Pick<PrismaUserHighlight, 'id' | 'userId'>;
type TextToSpeechSubject = Pick<PrismaTextToSpeech, 'id' | 'chapterId'>;
type CollectionSubject = Pick<PrismaCollection, 'id' | 'userId' | 'isPublic'>;
type LibrarySubject = { userId: string };

export type AppAction =
  'create' | 'read' | 'update' | 'delete' | 'join' | 'like' | 'manage';

export type AppSubject =
  | 'all'
  | 'ReadingRoom'
  | 'ReadingRoomMember'
  | 'ReadingRoomHighlight'
  | 'Statistics'
  | 'Bookmark'
  | 'Book'
  | 'Review'
  | 'Comment'
  | 'Chapter'
  | 'Post'
  | 'Like'
  | 'AIRequest'
  | 'Notification'
  | 'Follow'
  | 'UserHighlight'
  | 'TextToSpeech'
  | 'Recommendation'
  | 'Genre'
  | 'GenreAdministration'
  | 'Author'
  | 'AuthorAdministration'
  | 'AIRateLimitConfiguration'
  | 'User'
  | 'PublicUser'
  | 'Search'
  | 'ToxicWord'
  | 'Analytics'
  | 'LibraryCollection'
  | 'Library';

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
          Review: ReviewSubject;
          Comment: CommentSubject;
          Chapter: ChapterSubject;
          Post: PostSubject;
          Like: LikeSubject;
          AIRequest: AIRequestSubject;
          Notification: NotificationSubject;
          Follow: FollowSubject;
          UserHighlight: UserHighlightSubject;
          TextToSpeech: TextToSpeechSubject;
          LibraryCollection: CollectionSubject;
          Library: LibrarySubject;
        }>
    ),
  ],
  PrismaQueryOf<Prisma.TypeMap>
>;
