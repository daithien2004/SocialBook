import { AbilityBuilder, createMongoAbility, type CreateAbility } from '@casl/ability';
import type { MongoAbility, InferSubjects, ForcedSubject } from '@casl/ability';
import type { AppAction } from './actions';
import type { AppSubject } from './subjects';

// Lightweight shape interfaces for ownership checks
export interface PostSubject { userId: string }
export interface CommentSubject { userId: string }
export interface ReviewSubject { userId: string }
export interface UserHighlightSubject { userId: string }
export interface RoomCommentSubject { userId: string }
export interface RoomQuoteSubject { userId: string }
export interface RoomReactionSubject { userId: string }
export interface CollectionSubject { userId: string }

export type AppAbilitySubjects =
  | AppSubject
  | InferSubjects<
      | Record<'Post', PostSubject>
      | Record<'Comment', CommentSubject>
      | Record<'Review', ReviewSubject>
      | Record<'UserHighlight', UserHighlightSubject>
      | Record<'RoomComment', RoomCommentSubject>
      | Record<'RoomQuote', RoomQuoteSubject>
      | Record<'RoomReaction', RoomReactionSubject>
      | Record<'Collection', CollectionSubject>
    >
  | (PostSubject & ForcedSubject<'Post'>)
  | (CommentSubject & ForcedSubject<'Comment'>)
  | (ReviewSubject & ForcedSubject<'Review'>)
  | (UserHighlightSubject & ForcedSubject<'UserHighlight'>)
  | (RoomCommentSubject & ForcedSubject<'RoomComment'>)
  | (RoomQuoteSubject & ForcedSubject<'RoomQuote'>)
  | (RoomReactionSubject & ForcedSubject<'RoomReaction'>)
  | (CollectionSubject & ForcedSubject<'Collection'>);

export type AppAbility = MongoAbility<[AppAction, AppAbilitySubjects]>;
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

export type PrincipalRole = 'user' | 'writer' | 'admin';

export function defineRulesFor(role: PrincipalRole | string, currentUserId?: string): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createAppAbility);
  const { can } = builder;

  if (role === 'admin') {
    can('manage', 'all');
  } else {
    // Base rules for authenticated users
    if (currentUserId) {
      // Post ownership
      can('update', 'Post', { userId: currentUserId });
      can('delete', 'Post', { userId: currentUserId });
      // Comment ownership
      can('update', 'Comment', { userId: currentUserId });
      can('delete', 'Comment', { userId: currentUserId });
      // Review ownership
      can('update', 'Review', { userId: currentUserId });
      can('delete', 'Review', { userId: currentUserId });
      // UserHighlight ownership
      can('update', 'UserHighlight', { userId: currentUserId });
      can('delete', 'UserHighlight', { userId: currentUserId });
      // RoomComment ownership
      can('update', 'RoomComment', { userId: currentUserId });
      can('delete', 'RoomComment', { userId: currentUserId });
      // RoomQuote ownership
      can('update', 'RoomQuote', { userId: currentUserId });
      can('delete', 'RoomQuote', { userId: currentUserId });
      // RoomReaction ownership
      can('delete', 'RoomReaction', { userId: currentUserId });
      // Collection ownership
      can('update', 'Collection', { userId: currentUserId });
      can('delete', 'Collection', { userId: currentUserId });
    }
  }

  return builder.build();
}

export function canAccess(
  ability: AppAbility,
  action: AppAction,
  subject: AppSubject,
): boolean {
  return ability.can(action, subject);
}