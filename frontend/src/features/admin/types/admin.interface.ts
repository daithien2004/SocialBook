export interface ReadingHeatmapData {
    hour: number;
    count: number;
}

export interface ChapterEngagementData {
    chapterId: string;
    chapterTitle: string;
    bookTitle: string;
    viewCount: number;
    completionRate: number;
    averageTimeSpent: number;
}

export interface ReadingSpeedData {
    date: string;
    averageSpeed: number;
}

export interface GeographicData {
    country: string;
    userCount: number;
}

export interface ActiveUsersData {
    count: number;
    timestamp: string;
}