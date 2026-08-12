export interface PostModerationJobInput {
  postId: string;
  content: string;
}

export abstract class IPostModerationQueuePort {
  abstract enqueue(input: PostModerationJobInput): Promise<void>;
}
