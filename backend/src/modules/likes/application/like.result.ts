export interface ToggleLikeResult {
  isLiked: boolean;
  likeId: string;
  wasCreated: boolean;
}

export interface GetLikeCountResult {
  count: number;
}

export interface GetLikeStatusResult {
  isLiked: boolean;
}
