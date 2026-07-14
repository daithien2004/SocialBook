export enum ReadingRoomServerEvent {
  ROOM_SNAPSHOT = 'room_snapshot',
  PRESENCE_UPDATE = 'presence_update',
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  CHAPTER_CHANGED = 'chapter_changed',
  MODE_CHANGED = 'mode_changed',
  ROOM_ENDED = 'room_ended',
  ROOM_REACTIVATED = 'room_reactivated',
  ROOM_DELETED = 'room_deleted',
  HOST_CHANGED = 'host_changed',
  NEW_HIGHLIGHT = 'new_highlight',
  HIGHLIGHT_REMOVED = 'highlight_removed',
  UPDATE_HIGHLIGHT_INSIGHT = 'update_highlight_insight',
  NEW_CHAT_MESSAGE = 'new_chat_message',
  ANNOTATION_ADDED = 'annotation_added',
  ANNOTATION_REMOVED = 'annotation_removed',
  ERROR = 'error',

  COMMENT_ADDED = 'room:comment_added',
  COMMENT_DELETED = 'room:comment_deleted',
  REACTION_ADDED = 'room:reaction_added',
  REACTION_REMOVED = 'room:reaction_removed',
  PROGRESS_UPDATED = 'room:progress_updated',

  QUOTE_ADDED = 'room:quote_added',
  QUOTE_VOTED = 'room:quote_voted',

  // Collaborative reading (ephemeral, no DB)
  PARTY_REMOTE_SELECTION = 'party:remote_selection',
}

export enum ReadingRoomClientEvent {
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  CHAPTER_CHANGE = 'chapter_change',
  CHANGE_MODE = 'change_mode',
  END_ROOM = 'end_room',
  DELETE_ROOM = 'delete_room',
  HEARTBEAT = 'heartbeat',
  ADD_HIGHLIGHT = 'add_highlight',
  REMOVE_HIGHLIGHT = 'remove_highlight',
  SEND_CHAT_MESSAGE = 'send_chat_message',
  PARAGRAPH_COMMENTED = 'paragraph_commented',
  PARAGRAPH_COMMENT_DELETED = 'paragraph_comment_deleted',

  ADD_COMMENT = 'room:add_comment',
  DELETE_COMMENT = 'room:delete_comment',
  ADD_REACTION = 'room:add_reaction',
  REMOVE_REACTION = 'room:remove_reaction',

  ADD_QUOTE = 'room:add_quote',
  VOTE_QUOTE = 'room:vote_quote',

  // Collaborative reading (ephemeral, no DB)
  PARTY_SELECTION_UPDATE = 'party:selection_update',
  PARTY_SELECTION_CLEARED = 'party:selection_cleared',
}
