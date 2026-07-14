export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: string;
  meta?: {
    actorId?: string;
    username?: string;
    image?: string;
    targetId?: string;
  };
  actionUrl?: string;
}
