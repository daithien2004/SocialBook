export interface Book {
  id: string;
  author: Author;
  genres: Genre[];
  title: string;
  slug: string;
  publishedYear: string;
  description: string;
  coverUrl: string;
  status: 'draft' | 'published' | 'completed';
  tags: string[];
  views: number;
  likes: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  chapters: Chapter[];
}

export interface Author {
  id: string;
  name: string;
  bio: string;
}

export interface Genre {
  id: string;
  name: string;
  description: string;
}

export interface Chapter {
  id: string;
  title: string;
  slug: string;
  content: string;
  orderIndex: number;
  viewsCount: number;
}

export interface Comment {
  id: string;
  content: string;
  likesCount: number;
  createdAt: string;
}
