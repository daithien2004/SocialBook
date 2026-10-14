import { ApiProperty } from '@nestjs/swagger';
import type {
  ActiveUsersReadModel,
  BookStatsReadModel,
  ChapterEngagementReadModel,
  GeographicReadModel,
  GrowthMetricReadModel,
  OverviewStatsReadModel,
  ReadingHeatmapReadModel,
  ReadingSpeedReadModel,
  UserLocationSummaryReadModel,
  UserStatsReadModel,
} from '@/modules/statistics/application/read-models/statistics.read-model';

export class OverviewUsersResponseDto {
  @ApiProperty() total!: number;
  @ApiProperty() active!: number;
  @ApiProperty() banned!: number;
  @ApiProperty() growth!: number;
}

export class OverviewBooksResponseDto {
  @ApiProperty() total!: number;
  @ApiProperty() chapters!: number;
}

export class OverviewPostsResponseDto {
  @ApiProperty() total!: number;
  @ApiProperty() active!: number;
}

export class OverviewStatsResponseDto implements OverviewStatsReadModel {
  @ApiProperty({ type: OverviewUsersResponseDto })
  users!: OverviewUsersResponseDto;
  @ApiProperty({ type: OverviewBooksResponseDto })
  books!: OverviewBooksResponseDto;
  @ApiProperty({ type: OverviewPostsResponseDto })
  posts!: OverviewPostsResponseDto;
  @ApiProperty() comments!: number;
  @ApiProperty() reviews!: number;

  static fromReadModel(
    model: OverviewStatsReadModel,
  ): OverviewStatsResponseDto {
    const dto = new OverviewStatsResponseDto();
    dto.users = new OverviewUsersResponseDto();
    dto.users.total = model.users.total;
    dto.users.active = model.users.active;
    dto.users.banned = model.users.banned;
    dto.users.growth = model.users.growth;
    dto.books = new OverviewBooksResponseDto();
    dto.books.total = model.books.total;
    dto.books.chapters = model.books.chapters;
    dto.posts = new OverviewPostsResponseDto();
    dto.posts.total = model.posts.total;
    dto.posts.active = model.posts.active;
    dto.comments = model.comments;
    dto.reviews = model.reviews;
    return dto;
  }
}

export class UserProviderStatsResponseDto {
  @ApiProperty() local!: number;
  @ApiProperty() google!: number;
  @ApiProperty() facebook!: number;
}

export class UserRegistrationResponseDto {
  @ApiProperty() date!: string;
  @ApiProperty() count!: number;
}

export class UserStatsResponseDto implements UserStatsReadModel {
  @ApiProperty() total!: number;
  @ApiProperty() verified!: number;
  @ApiProperty() banned!: number;
  @ApiProperty({ type: UserProviderStatsResponseDto })
  byProvider!: UserProviderStatsResponseDto;
  @ApiProperty({ type: [UserRegistrationResponseDto] })
  recentRegistrations!: UserRegistrationResponseDto[];

  static fromReadModel(model: UserStatsReadModel): UserStatsResponseDto {
    const dto = new UserStatsResponseDto();
    dto.total = model.total;
    dto.verified = model.verified;
    dto.banned = model.banned;
    dto.byProvider = new UserProviderStatsResponseDto();
    dto.byProvider.local = model.byProvider.local;
    dto.byProvider.google = model.byProvider.google;
    dto.byProvider.facebook = model.byProvider.facebook;
    dto.recentRegistrations = model.recentRegistrations.map((item) => {
      const registration = new UserRegistrationResponseDto();
      registration.date = item.date;
      registration.count = item.count;
      return registration;
    });
    return dto;
  }
}

export class GenreCountResponseDto {
  @ApiProperty() genres!: string;
  @ApiProperty() count!: number;
}

export class PopularBookStatsResponseDto {
  @ApiProperty() views!: number;
  @ApiProperty() likes!: number;
}

export class PopularBookResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ type: PopularBookStatsResponseDto })
  stats!: PopularBookStatsResponseDto;
}

export class BookStatsResponseDto implements BookStatsReadModel {
  @ApiProperty() total!: number;
  @ApiProperty() totalChapters!: number;
  @ApiProperty({ type: [GenreCountResponseDto] })
  byGenre!: GenreCountResponseDto[];
  @ApiProperty({ type: [PopularBookResponseDto] })
  popularBooks!: PopularBookResponseDto[];

  static fromReadModel(model: BookStatsReadModel): BookStatsResponseDto {
    const dto = new BookStatsResponseDto();
    dto.total = model.total;
    dto.totalChapters = model.totalChapters;
    dto.byGenre = model.byGenre.map((item) => {
      const genre = new GenreCountResponseDto();
      genre.genres = item.genres;
      genre.count = item.count;
      return genre;
    });
    dto.popularBooks = model.popularBooks.map((item) => {
      const book = new PopularBookResponseDto();
      book.id = item.id;
      book.title = item.title;
      book.slug = item.slug;
      book.stats = new PopularBookStatsResponseDto();
      book.stats.views = item.stats.views;
      book.stats.likes = item.stats.likes;
      return book;
    });
    return dto;
  }
}

export class GrowthMetricResponseDto implements GrowthMetricReadModel {
  @ApiProperty() date!: string;
  @ApiProperty() users!: number;
  @ApiProperty() books!: number;
  @ApiProperty() posts!: number;

  static fromReadModel(model: GrowthMetricReadModel): GrowthMetricResponseDto {
    const dto = new GrowthMetricResponseDto();
    dto.date = model.date;
    dto.users = model.users;
    dto.books = model.books;
    dto.posts = model.posts;
    return dto;
  }
}

export class ReadingHeatmapResponseDto implements ReadingHeatmapReadModel {
  @ApiProperty() hour!: number;
  @ApiProperty() count!: number;

  static fromReadModel(
    model: ReadingHeatmapReadModel,
  ): ReadingHeatmapResponseDto {
    const dto = new ReadingHeatmapResponseDto();
    dto.hour = model.hour;
    dto.count = model.count;
    return dto;
  }
}

export class ChapterEngagementResponseDto implements ChapterEngagementReadModel {
  @ApiProperty() chapterId!: string;
  @ApiProperty() chapterTitle!: string;
  @ApiProperty() bookTitle!: string;
  @ApiProperty() viewCount!: number;
  @ApiProperty() completionRate!: number;
  @ApiProperty() averageTimeSpent!: number;

  static fromReadModel(
    model: ChapterEngagementReadModel,
  ): ChapterEngagementResponseDto {
    const dto = new ChapterEngagementResponseDto();
    dto.chapterId = model.chapterId;
    dto.chapterTitle = model.chapterTitle;
    dto.bookTitle = model.bookTitle;
    dto.viewCount = model.viewCount;
    dto.completionRate = model.completionRate;
    dto.averageTimeSpent = model.averageTimeSpent;
    return dto;
  }
}

export class ReadingSpeedResponseDto implements ReadingSpeedReadModel {
  @ApiProperty() date!: string;
  @ApiProperty() averageSpeed!: number;

  static fromReadModel(model: ReadingSpeedReadModel): ReadingSpeedResponseDto {
    const dto = new ReadingSpeedResponseDto();
    dto.date = model.date;
    dto.averageSpeed = model.averageSpeed;
    return dto;
  }
}

export class ActiveUsersResponseDto implements ActiveUsersReadModel {
  @ApiProperty() count!: number;
  @ApiProperty({ format: 'date-time' }) timestamp!: string;

  static fromReadModel(model: ActiveUsersReadModel): ActiveUsersResponseDto {
    const dto = new ActiveUsersResponseDto();
    dto.count = model.count;
    dto.timestamp = model.timestamp;
    return dto;
  }
}

export class GeographicResponseDto implements GeographicReadModel {
  @ApiProperty() country!: string;
  @ApiProperty() userCount!: number;

  static fromReadModel(model: GeographicReadModel): GeographicResponseDto {
    const dto = new GeographicResponseDto();
    dto.country = model.country;
    dto.userCount = model.userCount;
    return dto;
  }
}

export class UserLocationSampleResponseDto {
  @ApiProperty() username!: string;
  @ApiProperty() location!: string;
}

export class UserLocationSummaryResponseDto implements UserLocationSummaryReadModel {
  @ApiProperty() totalUsers!: number;
  @ApiProperty() usersWithLocation!: number;
  @ApiProperty({ type: [UserLocationSampleResponseDto] })
  sampleUsers!: UserLocationSampleResponseDto[];

  static fromReadModel(
    model: UserLocationSummaryReadModel,
  ): UserLocationSummaryResponseDto {
    const dto = new UserLocationSummaryResponseDto();
    dto.totalUsers = model.totalUsers;
    dto.usersWithLocation = model.usersWithLocation;
    dto.sampleUsers = model.sampleUsers.map((item) => {
      const sample = new UserLocationSampleResponseDto();
      sample.username = item.username;
      sample.location = item.location;
      return sample;
    });
    return dto;
  }
}
