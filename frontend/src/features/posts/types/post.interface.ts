import { User } from '../../auth/slice/authSlice';
import { Book } from '../../books/types/book.interface';

export interface Post {
  id: string;
  userId: User;
  userName: string;
  userAvatar: string;
  bookId: Book;
  bookTitle: string;
  content: string;
  imageUrls: string[];
  isDelete: boolean;
  createdAt: Date;
  totalLikes?: number;
  totalComments?: number;
  likedByCurrentUser?: boolean;
}
