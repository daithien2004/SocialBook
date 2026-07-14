export interface UserHighlight {
    id: string;
    bookId: string;
    chapterId: string;
    paragraphId: string;
    content: string;
    color: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserHighlightPayload {
    bookId: string;
    chapterId: string;
    paragraphId: string;
    content: string;
    color?: string;
    note?: string;
}

export interface UpdateUserHighlightPayload {
    id: string;
    color?: string;
    note?: string;
}
