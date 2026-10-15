export interface CommentUserReadModel {
  id: string;
  username: string;
  image: string;
}

export interface CommentReadModel {
  id: string;
  content: string;
  targetId: string;
  targetType: string;
  parentId: string | null;
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
  isFlagged: boolean;
  moderationStatus: string;
  createdAt: Date;
  updatedAt: Date;
  user: CommentUserReadModel;
}
