export interface BookFiltersReadModel {
  genres: Array<{ id: string; name: string; slug: string; count: number }>;
  tags: Array<{ name: string; count: number }>;
}
