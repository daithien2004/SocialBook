export interface ModerationQueueItem {
    _id: string;
    contentType: 'post' | 'review' | 'comment';
    userId: { username: string; email: string; image?: string };
    content: string;
    rejectionReason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    moderationResult: {
        isSafe: boolean;
        isSpoiler: boolean;
        isToxic: boolean;
        reason?: string;
    };
}

export interface ModerationQueueResponse {
    items: ModerationQueueItem[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}