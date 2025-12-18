/**
 * Mock comments data for development/placeholder purposes.
 * In production, comments are fetched from the API via the comments feature.
 */

export interface MockComment {
    id: string;
    userId: string;
    content: string;
    likesCount: number;
    createdAt: string;
    targetType: 'book' | 'chapter';
    targetId: string;
}

// Empty array - actual comments are fetched from the API
// This is kept for backward compatibility with components that expect this structure
export const comments: MockComment[] = [];
