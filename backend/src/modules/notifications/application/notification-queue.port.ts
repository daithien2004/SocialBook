import {
  CommentCreatedJobPayload,
  LikeToggledJobPayload,
  UserFollowedJobPayload,
  PostModeratedJobPayload,
} from '@/modules/notifications/application/public-api';

export const INotificationQueuePort = Symbol('INotificationQueuePort');

export interface INotificationQueuePort {
  queueCommentCreated(payload: CommentCreatedJobPayload): Promise<void>;
  queueLikeToggled(payload: LikeToggledJobPayload): Promise<void>;
  queueUserFollowed(payload: UserFollowedJobPayload): Promise<void>;
  queuePostModerated(payload: PostModeratedJobPayload): Promise<void>;
}
