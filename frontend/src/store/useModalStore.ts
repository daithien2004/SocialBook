import { create } from 'zustand';
import type { ReactNode } from 'react';
import { Post } from '@/features/posts/types/post.interface';
import { BookForAdmin } from '@/features/books/types/book.interface';
import { Chapter } from '@/features/chapters/types/chapter.interface';

export type ModalName = 
  | 'createPost'
  | 'editPost'
  | 'sharePost'
  | 'postComment'
  | 'addToLibrary'
  | 'followers'
  | 'chapterSummary'
  | 'fileImport'
  | 'deleteBook'
  | 'createCollection'
  | 'editCollection'
  | 'confirm'
  | 'genre'
  | 'author'
  | 'manageChapter';

export interface CreatePostModalData {
  defaultContent?: string;
  defaultBookId?: string;
  defaultBookTitle?: string;
  title?: string;
  contentLabel?: string;
  contentPlaceholder?: string;
  maxImages?: number;
  onSubmit?: (data: { content: string; images: File[]; bookId: string }) => Promise<void>;
}

export interface EditPostModalData {
  post: Post;
}

export interface SharePostModalData {
  postUrl: string;
  shareTitle: string;
  shareMedia: string;
}

export interface PostCommentModalData {
  post: Post;
  handleLike: (postId: string) => void;
  commentCount?: number;
  likeStatus?: boolean;
  likeCount?: number;
}

export interface AddToLibraryModalData {
  bookId: string;
}

export interface ChapterSummaryModalData {
  chapterId: string;
  chapterTitle: string;
}

export interface FileImportModalData {
  bookSlug: string;
  currentChapterCount: number;
  onImport: (chapters: { title: string; content: string }[]) => void;
}

export interface CreateCollectionModalData {
  onSuccess?: () => void;
}

export interface EditCollectionModalData {
  collectionId: string;
  currentName: string;
  onSuccess?: () => void;
}

export interface DeleteBookModalData {
  book: BookForAdmin;
  isDeleting: boolean;
  onConfirm: () => void;
}

export interface ConfirmModalData {
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export interface GenreModalData {
  genre?: {
    id: string;
    name: string;
    description?: string;
  };
  onSuccess?: () => void;
}

export interface AuthorModalData {
  author?: {
    id: string;
    name: string;
    bio?: string;
    photoUrl?: string;
  };
  onSuccess?: () => void;
}

export interface ManageChapterModalData {
  bookSlug: string;
  bookId: string;
  chapter?: Chapter; // Optional for edit mode
  onSuccess?: () => void;
}

export type ModalDataType = 
  | Record<string, unknown>
  | CreatePostModalData
  | EditPostModalData
  | SharePostModalData
  | PostCommentModalData
  | AddToLibraryModalData
  | ChapterSummaryModalData
  | FileImportModalData
  | CreateCollectionModalData
  | EditCollectionModalData
  | DeleteBookModalData
  | ConfirmModalData
  | GenreModalData
  | AuthorModalData
  | ManageChapterModalData
  | null;

export interface ModalState {
  isOpen: boolean;
  data: ModalDataType;
}

export interface ModalStore {
  // Dynamic State
  modals: Record<ModalName, ModalState>;
  openModal: (name: ModalName, data?: ModalDataType) => void;
  closeModal: (name: ModalName) => void;

  // Legacy state for backwards compatibility
  isCreatePostOpen: boolean;
  createPostData: CreatePostModalData | null;
  openCreatePost: (data?: CreatePostModalData) => void;
  closeCreatePost: () => void;

  isEditPostOpen: boolean;
  editPostData: EditPostModalData | null;
  openEditPost: (data: EditPostModalData) => void;
  closeEditPost: () => void;

  isSharePostOpen: boolean;
  sharePostData: SharePostModalData | null;
  openSharePost: (data: SharePostModalData) => void;
  closeSharePost: () => void;

  isPostCommentOpen: boolean;
  postCommentData: PostCommentModalData | null;
  openPostComment: (data: PostCommentModalData) => void;
  closePostComment: () => void;

  isAddToLibraryOpen: boolean;
  addToLibraryData: AddToLibraryModalData | null;
  openAddToLibrary: (data: AddToLibraryModalData) => void;
  closeAddToLibrary: () => void;

  isFollowersOpen: boolean;
  followersData: { userId: string; count?: number } | null;
  openFollowers: (data: { userId: string; count?: number }) => void;
  closeFollowers: () => void;

  isChapterSummaryOpen: boolean;
  chapterSummaryData: ChapterSummaryModalData | null;
  openChapterSummary: (data: ChapterSummaryModalData) => void;
  closeChapterSummary: () => void;

  isFileImportOpen: boolean;
  fileImportData: FileImportModalData | null;
  openFileImport: (data: FileImportModalData) => void;
  closeFileImport: () => void;

  isDeleteBookOpen: boolean;
  deleteBookData: DeleteBookModalData | null;
  openDeleteBook: (data: DeleteBookModalData) => void;
  closeDeleteBook: () => void;

  isCreateCollectionOpen: boolean;
  createCollectionData: CreateCollectionModalData | null;
  openCreateCollection: (data?: CreateCollectionModalData) => void;
  closeCreateCollection: () => void;

  isEditCollectionOpen: boolean;
  editCollectionData: EditCollectionModalData | null;
  openEditCollection: (data: EditCollectionModalData) => void;
  closeEditCollection: () => void;

  isConfirmOpen: boolean;
  confirmData: ConfirmModalData | null;
  openConfirm: (data: ConfirmModalData) => void;
  closeConfirm: () => void;

  isGenreModalOpen: boolean;
  genreModalData: GenreModalData | null;
  openGenreModal: (data?: GenreModalData) => void;
  closeGenreModal: () => void;

  isAuthorModalOpen: boolean;
  authorModalData: AuthorModalData | null;
  openAuthorModal: (data?: AuthorModalData) => void;
  closeAuthorModal: () => void;

  isManageChapterOpen: boolean;
  manageChapterData: ManageChapterModalData | null;
  openManageChapter: (data: ManageChapterModalData) => void;
  closeManageChapter: () => void;
}

const initialModalsState: Record<ModalName, ModalState> = {
  createPost: { isOpen: false, data: {} },
  editPost: { isOpen: false, data: null },
  sharePost: { isOpen: false, data: null },
  postComment: { isOpen: false, data: null },
  addToLibrary: { isOpen: false, data: null },
  followers: { isOpen: false, data: null },
  chapterSummary: { isOpen: false, data: null },
  fileImport: { isOpen: false, data: null },
  deleteBook: { isOpen: false, data: null },
  createCollection: { isOpen: false, data: null },
  editCollection: { isOpen: false, data: null },
  confirm: { isOpen: false, data: null },
  genre: { isOpen: false, data: null },
  author: { isOpen: false, data: null },
  manageChapter: { isOpen: false, data: null },
};

export const useModalStore = create<ModalStore>((set, get) => {
  const syncLegacyProps = (modals: Record<ModalName, ModalState>) => ({
    isCreatePostOpen: modals.createPost.isOpen,
    createPostData: modals.createPost.data as CreatePostModalData | null,
    isEditPostOpen: modals.editPost.isOpen,
    editPostData: modals.editPost.data as EditPostModalData | null,
    isSharePostOpen: modals.sharePost.isOpen,
    sharePostData: modals.sharePost.data as SharePostModalData | null,
    isPostCommentOpen: modals.postComment.isOpen,
    postCommentData: modals.postComment.data as PostCommentModalData | null,
    isAddToLibraryOpen: modals.addToLibrary.isOpen,
    addToLibraryData: modals.addToLibrary.data as AddToLibraryModalData | null,
    isFollowersOpen: modals.followers.isOpen,
    followersData: modals.followers.data as { userId: string; count?: number } | null,
    isChapterSummaryOpen: modals.chapterSummary.isOpen,
    chapterSummaryData: modals.chapterSummary.data as ChapterSummaryModalData | null,
    isFileImportOpen: modals.fileImport.isOpen,
    fileImportData: modals.fileImport.data as FileImportModalData | null,
    isDeleteBookOpen: modals.deleteBook.isOpen,
    deleteBookData: modals.deleteBook.data as DeleteBookModalData | null,
    isCreateCollectionOpen: modals.createCollection.isOpen,
    createCollectionData: modals.createCollection.data as CreateCollectionModalData | null,
    isEditCollectionOpen: modals.editCollection.isOpen,
    editCollectionData: modals.editCollection.data as EditCollectionModalData | null,
    isConfirmOpen: modals.confirm.isOpen,
    confirmData: modals.confirm.data as ConfirmModalData | null,
    isGenreModalOpen: modals.genre.isOpen,
    genreModalData: modals.genre.data as GenreModalData | null,
    isAuthorModalOpen: modals.author.isOpen,
    authorModalData: modals.author.data as AuthorModalData | null,
    isManageChapterOpen: modals.manageChapter.isOpen,
    manageChapterData: modals.manageChapter.data as ManageChapterModalData | null,
  });

  return {
    modals: initialModalsState,

    openModal: (name, data) => set((state) => {
      const updated = {
        ...state.modals,
        [name]: { isOpen: true, data: data || (name === 'createPost' ? {} : null) }
      };
      return {
        modals: updated,
        ...syncLegacyProps(updated)
      };
    }),

    closeModal: (name) => set((state) => {
      const updated = {
        ...state.modals,
        [name]: { isOpen: false, data: name === 'createPost' ? {} : null }
      };
      return {
        modals: updated,
        ...syncLegacyProps(updated)
      };
    }),

    ...syncLegacyProps(initialModalsState),

    openCreatePost: (data) => get().openModal('createPost', data),
    closeCreatePost: () => get().closeModal('createPost'),

    openEditPost: (data) => get().openModal('editPost', data),
    closeEditPost: () => get().closeModal('editPost'),

    openSharePost: (data) => get().openModal('sharePost', data),
    closeSharePost: () => get().closeModal('sharePost'),

    openPostComment: (data) => get().openModal('postComment', data),
    closePostComment: () => get().closeModal('postComment'),

    openAddToLibrary: (data) => get().openModal('addToLibrary', data),
    closeAddToLibrary: () => get().closeModal('addToLibrary'),

    openFollowers: (data) => get().openModal('followers', data),
    closeFollowers: () => get().closeModal('followers'),

    openChapterSummary: (data) => get().openModal('chapterSummary', data),
    closeChapterSummary: () => get().closeModal('chapterSummary'),

    openFileImport: (data) => get().openModal('fileImport', data),
    closeFileImport: () => get().closeModal('fileImport'),

    openDeleteBook: (data) => get().openModal('deleteBook', data),
    closeDeleteBook: () => get().closeModal('deleteBook'),

    openCreateCollection: (data) => get().openModal('createCollection', data),
    closeCreateCollection: () => get().closeModal('createCollection'),

    openEditCollection: (data) => get().openModal('editCollection', data),
    closeEditCollection: () => get().closeModal('editCollection'),

    openConfirm: (data) => get().openModal('confirm', data),
    closeConfirm: () => get().closeModal('confirm'),

    openGenreModal: (data) => get().openModal('genre', data),
    closeGenreModal: () => get().closeModal('genre'),

    openAuthorModal: (data) => get().openModal('author', data),
    closeAuthorModal: () => get().closeModal('author'),

    openManageChapter: (data) => get().openModal('manageChapter', data),
    closeManageChapter: () => get().closeModal('manageChapter'),
  };
});
