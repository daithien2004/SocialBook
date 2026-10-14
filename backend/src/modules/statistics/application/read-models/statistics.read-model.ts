export interface OverviewStatsReadModel {
  users: {
    total: number;
    active: number;
    banned: number;
    growth: number;
  };
  books: {
    total: number;
    chapters: number;
  };
  posts: {
    total: number;
    active: number;
  };
  comments: number;
  reviews: number;
}

export interface UserStatsReadModel {
  total: number;
  verified: number;
  banned: number;
  byProvider: {
    local: number;
    google: number;
    facebook: number;
  };
  recentRegistrations: Array<{
    date: string;
    count: number;
  }>;
}

export interface BookStatsReadModel {
  total: number;
  totalChapters: number;
  byGenre: Array<{
    genres: string;
    count: number;
  }>;
  popularBooks: Array<{
    id: string;
    title: string;
    slug: string;
    stats: {
      views: number;
      likes: number;
    };
  }>;
}

export interface GrowthMetricReadModel {
  date: string;
  users: number;
  books: number;
  posts: number;
}

export interface ReadingHeatmapReadModel {
  hour: number;
  count: number;
}

export interface ChapterEngagementReadModel {
  chapterId: string;
  chapterTitle: string;
  bookTitle: string;
  viewCount: number;
  completionRate: number;
  averageTimeSpent: number;
}

export interface ReadingSpeedReadModel {
  date: string;
  averageSpeed: number;
}

export interface GeographicReadModel {
  country: string;
  userCount: number;
}

export interface ActiveUsersReadModel {
  count: number;
  timestamp: string;
}

export interface UserLocationSummaryReadModel {
  totalUsers: number;
  usersWithLocation: number;
  sampleUsers: Array<{ username: string; location: string }>;
}
