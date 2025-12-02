// notifications/types.ts
export type NotificationPayload = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  meta?: Record<string, any>;
};
