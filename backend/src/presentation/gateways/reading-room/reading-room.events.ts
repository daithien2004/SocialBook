export enum ReadingRoomServerEvent {
  PRESENCE_UPDATE = 'presence_update',
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  NEW_HIGHLIGHT = 'new_highlight',
  HIGHLIGHT_REMOVED = 'highlight_removed',
  UPDATE_HIGHLIGHT_INSIGHT = 'update_highlight_insight',
  ERROR = 'error',
}

export enum ReadingRoomClientEvent {
  GENERATE_HIGHLIGHT_INSIGHT = 'generate_highlight_insight',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  HEARTBEAT = 'heartbeat',
  ADD_HIGHLIGHT = 'add_highlight',
  REMOVE_HIGHLIGHT = 'remove_highlight',
}
