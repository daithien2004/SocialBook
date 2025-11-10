export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  reads: string;
  genre: string;
  description: string;
  isNew?: boolean;
  isTrending?: boolean;
}
