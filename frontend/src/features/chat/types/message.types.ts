export interface Message {
  user: string;
  text: string;
  room?: string;
  private?: boolean;
  messageId: string;
  deliveredTo: string[];
  readBy: string[];
  timestamp?: number;
}

export interface TypingState {
  user: string;
  isTyping: boolean;
}

export interface DeliveryReceipt {
  messageId: string;
  deliveredTo: string[];
}

export interface ReadReceipt {
  messageId: string;
  readBy: string;
}

export interface ChatRoom {
  name: string;
  users: string[];
  messages: Message[];
}

export interface SendMessagePayload {
  room?: string;
  to?: string;
  text: string;
}

export interface JoinRoomPayload {
  room: string;
}

export interface TypingPayload {
  room?: string;
  to?: string;
  isTyping: boolean;
}
