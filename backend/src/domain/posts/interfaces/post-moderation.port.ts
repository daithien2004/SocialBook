export interface PostModerationJobInput {
  postId: string;
  content: string;
}

export abstract class IPostModerationPort {
  abstract enqueue(input: PostModerationJobInput): Promise<void>;
}
