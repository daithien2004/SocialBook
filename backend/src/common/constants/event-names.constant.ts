export const EventNames = {
  // Book events
  BOOK_CREATED: 'book.created',
  BOOK_UPDATED: 'book.updated',
  BOOK_DELETED: 'book.deleted',
  BOOK_VIEWED: 'book.viewed',

  // Audio events
  AUDIO_PLAYED: 'audio.played',

  // Reading room events
  READING_ROOM_REACTIVATED: 'reading-room.reactivated',
  READING_ROOM_HIGHLIGHT_INSIGHT_UPDATED:
    'reading-room.highlight_insight_updated',

  // User events
  USER_ROLE_CHANGED: 'user.role.changed',
  USER_EVENT_TRACKED: 'user-event.tracked',

  // Social events
  POST_CREATED: 'post.created',
  COMMENT_CREATED: 'comment.created',
  LIKE_TOGGLED: 'like.toggled',

  // Moderation events
  TOXIC_WORDS_UPDATED: 'toxic-words.updated',
} as const;
