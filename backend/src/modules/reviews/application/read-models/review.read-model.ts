export interface ReviewReadModel {
  readonly id: string;
  readonly content: string;
  readonly rating: number;
  readonly likesCount: number;
  readonly verifiedPurchase: boolean;
  readonly isFlagged: boolean;
  readonly moderationStatus: string;
  readonly user: {
    readonly id: string;
    readonly username: string;
    readonly image: string | null;
  };
  readonly book: {
    readonly id: string;
    readonly title: string;
    readonly coverUrl: string | null;
  };
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly isLiked: boolean;
}

export interface ReviewLikeResult {
  readonly likesCount: number;
  readonly isLiked: boolean;
}
