export enum ErrorMessages {
    // Common
    INVALID_ID = 'Invalid ID format',
    NOT_FOUND = 'Resource not found',
    PERMISSION_DENIED = 'You do not have permission',
    SEARCH_REQUIRED = 'Search keyword is required',

    // User
    USER_NOT_FOUND = 'User not found',
    EMAIL_EXISTS = 'Email already exists',
    USERNAME_TAKEN = 'Username is already taken',

    // File/Image
    IMAGE_REQUIRED = 'Image file is required',
    FILE_NOT_IMAGE = 'File must be an image',
    IMAGE_TOO_LARGE = 'Image is too large (max 5MB)',

    // Book
    BOOK_NOT_FOUND = 'Book not found',

    // Chapter
    CHAPTER_NOT_FOUND = 'Chapter not found',
    CHAPTER_MISSING_BOOK = 'Chapter is missing book reference',
    NO_CHAPTERS_FOUND = 'No chapters found for this book',

    // Review
    REVIEW_NOT_FOUND = 'Review not found',
    REVIEW_ALREADY_EXISTS = 'You have already reviewed this book',
    REVIEW_CREATE_FAILED = 'Failed to create review',
    REVIEW_UPDATE_FORBIDDEN = 'You do not have permission to update this review',
    REVIEW_DELETE_FORBIDDEN = 'You do not have permission to delete this review',

    // Post
    POST_NOT_FOUND = 'Post not found',
    POST_UPDATE_FORBIDDEN = 'You do not have permission to update this post',
    POST_DELETE_FORBIDDEN = 'You do not have permission to delete this post',

    // Comment
    COMMENT_NOT_FOUND = 'Comment not found',
    PARENT_COMMENT_NOT_FOUND = 'Parent comment not found',
    COMMENT_UPDATE_FORBIDDEN = 'You do not have permission to update this comment',
    COMMENT_DELETE_FORBIDDEN = 'You do not have permission to delete this comment',

    // Author
    AUTHOR_NOT_FOUND = 'Author not found',

    // Genre
    GENRE_NOT_FOUND = 'Genre not found',

    // Collection
    COLLECTION_NOT_FOUND = 'Collection not found',

    // Follow
    FOLLOW_USER_NOT_FOUND = 'User to follow not found',
    CANNOT_FOLLOW_SELF = 'You cannot follow yourself',

    // Author
    AUTHOR_EXISTS = 'Author with this name already exists',

    // Genre
    GENRE_EXISTS = 'Genre with this name already exists',

    // Auth
    INVALID_CREDENTIALS = 'Invalid email or password',
    TOKEN_EXPIRED = 'Token has expired',
    TOKEN_INVALID = 'Invalid token',

    // TTS
    TTS_UPDATE_FAILED = 'Failed to update TTS record',
    TTS_API_KEY_NOT_FOUND = 'VoiceRSS API key not found',
    TTS_API_ERROR = 'VoiceRSS API error',

    // Onboarding
    ONBOARDING_NOT_FOUND = 'Onboarding session not found',
}

export enum SuccessMessages {
    CREATED = 'Created successfully',
    UPDATED = 'Updated successfully',
    DELETED = 'Deleted successfully',
}
