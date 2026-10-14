import type {
  ChapterEngagementReadModel,
  ReadingHeatmapReadModel,
  ReadingSpeedReadModel,
} from '@/modules/statistics/application/read-models/statistics.read-model';

export class StatisticsReadMapper {
  static toReadingHeatmap(rows: unknown[]): ReadingHeatmapReadModel[] {
    const counts = new Map(
      rows.map((value) => {
        const row = this.requireRecord(value);
        return [
          this.requireInteger(row.get('hour'), 'hour'),
          this.requireInteger(row.get('count'), 'count'),
        ];
      }),
    );

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: counts.get(hour) ?? 0,
    }));
  }

  static toChapterEngagement(rows: unknown[]): ChapterEngagementReadModel[] {
    return rows.map((value) => {
      const row = this.requireRecord(value);
      return {
        chapterId: this.requireString(row.get('chapterId'), 'chapterId'),
        chapterTitle: this.requireString(
          row.get('chapterTitle'),
          'chapterTitle',
        ),
        bookTitle: this.requireString(row.get('bookTitle'), 'bookTitle'),
        viewCount: this.requireInteger(row.get('viewCount'), 'viewCount'),
        completionRate:
          Math.round(
            this.requireNumber(row.get('completionRate'), 'completionRate') *
              10,
          ) / 10,
        averageTimeSpent: Math.round(
          this.requireNumber(row.get('averageTimeSpent'), 'averageTimeSpent'),
        ),
      };
    });
  }

  static toReadingSpeed(rows: unknown[]): ReadingSpeedReadModel[] {
    return rows.map((value) => {
      const row = this.requireRecord(value);
      return {
        date: this.requireString(row.get('date'), 'date'),
        averageSpeed: Math.round(
          this.requireNumber(row.get('averageSpeed'), 'averageSpeed'),
        ),
      };
    });
  }

  static toRegistrationRows(
    rows: unknown[],
  ): Array<{ date: string; count: number }> {
    return rows.map((value) => {
      const row = this.requireRecord(value);
      return {
        date: this.requireString(row.get('date'), 'date'),
        count: this.requireInteger(row.get('count'), 'count'),
      };
    });
  }

  private static requireRecord(value: unknown): Map<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('Unexpected PostgreSQL statistics row');
    }
    return new Map(Object.entries(value));
  }

  private static requireString(value: unknown, field: string): string {
    if (typeof value !== 'string') {
      throw new Error(`Invalid PostgreSQL statistics field: ${field}`);
    }
    return value;
  }

  private static requireNumber(value: unknown, field: string): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'bigint') return Number(value);
    throw new Error(`Invalid PostgreSQL statistics field: ${field}`);
  }

  private static requireInteger(value: unknown, field: string): number {
    const number = this.requireNumber(value, field);
    if (Number.isInteger(number)) return number;
    throw new Error(`Invalid PostgreSQL statistics field: ${field}`);
  }
}
