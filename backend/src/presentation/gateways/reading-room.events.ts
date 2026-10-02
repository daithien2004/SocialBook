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
  ERROR = 'error',
}

export enum ReadingRoomClientEvent {
  GENERATE_HIGHLIGHT_INSIGHT = 'generate_highlight_insight',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  CHAPTER_CHANGE = 'chapter_change',
  CHANGE_MODE = 'change_mode',
  END_ROOM = 'end_room',
  DELETE_ROOM = 'delete_room',
  HEARTBEAT = 'heartbeat',
  ADD_HIGHLIGHT = 'add_highlight',
  REMOVE_HIGHLIGHT = 'remove_highlight',
}

