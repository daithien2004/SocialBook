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
  reviews: Review[];
  chapters: Chapter[];
  totalRatings: number;
  averageRating: number;
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

export interface Review {
  id: string;
  content: string;
  user: {
    id: string;
    username: string;
    image?: string;
  };
  likesCount: number;
  createdAt: string;
}


export interface BookForAdmin {
  id: string;
  authorId: {
    id: string;
    name: string;
  };
  genre: {
    id: string;
    name: string;
  }[];
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
  stats: {
    chapters: number;
    views: number;
    likes: string; // backend trả về string
  };
}

export interface BackendPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}