import { create } from 'zustand';
import { Post } from '@/features/posts/types/post.interface';
import { BookForAdmin } from '@/features/books/types/book.interface';
import { Chapter } from '@/features/chapters/types/chapter.interface';

interface CreatePostModalData {
  defaultContent?: string;
  defaultBookId?: string;
  defaultBookTitle?: string;
  title?: string;
  contentLabel?: string;
  contentPlaceholder?: string;
  maxImages?: number;
  onSubmit?: (data: { content: string; images: File[]; bookId: string }) => Promise<void>;
}

interface EditPostModalData {
  post: Post;
}

interface SharePostModalData {
  postUrl: string;
  shareTitle: string;
  shareMedia: string;
}

interface PostCommentModalData {
  post: Post;
  handleLike: (postId: string) => void;
  commentCount?: number;
  likeStatus?: boolean;
  likeCount?: number;
}

interface AddToLibraryModalData {
  bookId: string;
}

interface ChapterSummaryModalData {
  chapterId: string;
  chapterTitle: string;
}

interface FileImportModalData {
  bookSlug: string;
  currentChapterCount: number;
  onImport: (chapters: { title: string; content: string }[]) => void;
}

interface CreateCollectionModalData {
  onSuccess?: () => void;
}

interface EditCollectionModalData {
  collectionId: string;
  currentName: string;
  onSuccess?: () => void;
}

interface DeleteBookModalData {
  book: BookForAdmin;
  isDeleting: boolean;
  onConfirm: () => void;
}

interface ConfirmModalData {
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

interface GenreModalData {
  genre?: {
    id: string;
    name: string;
    description?: string;
  };
  onSuccess?: () => void;
}

interface AuthorModalData {
  author?: {
    id: string;
    name: string;
    bio?: string;
    photoUrl?: string;
  };
  onSuccess?: () => void;
}

interface ManageChapterModalData {
  bookSlug: string;
  bookId: string;
  chapter?: Chapter; // Optional for edit mode
  onSuccess?: () => void;
}

interface ModalStore {
  // Create Post Modal
  isCreatePostOpen: boolean;
  createPostData: CreatePostModalData;
  openCreatePost: (data?: CreatePostModalData) => void;
  closeCreatePost: () => void;

  // Edit Post Modal
  isEditPostOpen: boolean;
  editPostData: EditPostModalData | null;
  openEditPost: (data: EditPostModalData) => void;
  closeEditPost: () => void;

  // Share Post Modal
  isSharePostOpen: boolean;
  sharePostData: SharePostModalData | null;
  openSharePost: (data: SharePostModalData) => void;
  closeSharePost: () => void;

  // Post Comment Modal
  isPostCommentOpen: boolean;
  postCommentData: PostCommentModalData | null;
  openPostComment: (data: PostCommentModalData) => void;
  closePostComment: () => void;

  // Add To Library Modal
  isAddToLibraryOpen: boolean;
  addToLibraryData: AddToLibraryModalData | null;
  openAddToLibrary: (data: AddToLibraryModalData) => void;
  closeAddToLibrary: () => void;

  // Followers Modal
  isFollowersOpen: boolean;
  followersData: { userId: string; count?: number } | null;
  openFollowers: (data: { userId: string; count?: number }) => void;
  closeFollowers: () => void;

  // Chapter Summary Modal
  isChapterSummaryOpen: boolean;
  chapterSummaryData: ChapterSummaryModalData | null;
  openChapterSummary: (data: ChapterSummaryModalData) => void;
  closeChapterSummary: () => void;

  // File Import Modal
  isFileImportOpen: boolean;
  fileImportData: FileImportModalData | null;
  openFileImport: (data: FileImportModalData) => void;
  closeFileImport: () => void;

  // Delete Book Modal
  isDeleteBookOpen: boolean;
  deleteBookData: DeleteBookModalData | null;
  openDeleteBook: (data: DeleteBookModalData) => void;
  closeDeleteBook: () => void;

  // Create Collection Modal
  isCreateCollectionOpen: boolean;
  createCollectionData: CreateCollectionModalData | null;
  openCreateCollection: (data?: CreateCollectionModalData) => void;
  closeCreateCollection: () => void;

  // Edit Collection Modal
  isEditCollectionOpen: boolean;
  editCollectionData: EditCollectionModalData | null;
  openEditCollection: (data: EditCollectionModalData) => void;
  closeEditCollection: () => void;

  // Generic Confirmation Modal
  isConfirmOpen: boolean;
  confirmData: ConfirmModalData | null;
  openConfirm: (data: ConfirmModalData) => void;
  closeConfirm: () => void;

  // Genre Modals
  isGenreModalOpen: boolean;
  genreModalData: GenreModalData | null;
  openGenreModal: (data?: GenreModalData) => void;
  closeGenreModal: () => void;

  // Author Modals
  isAuthorModalOpen: boolean;
  authorModalData: AuthorModalData | null;
  openAuthorModal: (data?: AuthorModalData) => void;
  closeAuthorModal: () => void;

  // Chapter Management
  isManageChapterOpen: boolean;
  manageChapterData: ManageChapterModalData | null;
  openManageChapter: (data: ManageChapterModalData) => void;
  closeManageChapter: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  // Create Post Modal
  isCreatePostOpen: false,
  createPostData: {},
  openCreatePost: (data) =>
    set({
      isCreatePostOpen: true,
      createPostData: data || {},
    }),
  closeCreatePost: () =>
    set({
      isCreatePostOpen: false,
      createPostData: {},
    }),

  // Edit Post Modal
  isEditPostOpen: false,
  editPostData: null,
  openEditPost: (data) =>
    set({
      isEditPostOpen: true,
      editPostData: data,
    }),
  closeEditPost: () =>
    set({
      isEditPostOpen: false,
      editPostData: null,
    }),

  // Share Post Modal
  isSharePostOpen: false,
  sharePostData: null,
  openSharePost: (data) =>
    set({
      isSharePostOpen: true,
      sharePostData: data,
    }),
  closeSharePost: () =>
    set({
      isSharePostOpen: false,
      sharePostData: null,
    }),

  // Post Comment Modal
  isPostCommentOpen: false,
  postCommentData: null,
  openPostComment: (data) =>
    set({
      isPostCommentOpen: true,
      postCommentData: data,
    }),
  closePostComment: () =>
    set({
      isPostCommentOpen: false,
      postCommentData: null,
    }),

  // Add To Library Modal
  isAddToLibraryOpen: false,
  addToLibraryData: null,
  openAddToLibrary: (data) =>
    set({
      isAddToLibraryOpen: true,
      addToLibraryData: data,
    }),
  closeAddToLibrary: () =>
    set({
      isAddToLibraryOpen: false,
      addToLibraryData: null,
    }),

  // Followers Modal
  isFollowersOpen: false,
  followersData: null,
  openFollowers: (data) => set({ isFollowersOpen: true, followersData: data }),
  closeFollowers: () => set({ isFollowersOpen: false, followersData: null }),

  // Chapter Summary Modal
  isChapterSummaryOpen: false,
  chapterSummaryData: null,
  openChapterSummary: (data) => set({ isChapterSummaryOpen: true, chapterSummaryData: data }),
  closeChapterSummary: () => set({ isChapterSummaryOpen: false, chapterSummaryData: null }),

  // File Import Modal
  isFileImportOpen: false,
  fileImportData: null,
  openFileImport: (data) => set({ isFileImportOpen: true, fileImportData: data }),
  closeFileImport: () => set({ isFileImportOpen: false, fileImportData: null }),

  // Delete Book Modal
  isDeleteBookOpen: false,
  deleteBookData: null,
  openDeleteBook: (data) => set({ isDeleteBookOpen: true, deleteBookData: data }),
  closeDeleteBook: () => set({ isDeleteBookOpen: false, deleteBookData: null }),

  // Create Collection Modal
  isCreateCollectionOpen: false,
  createCollectionData: null,
  openCreateCollection: (data) => set({ isCreateCollectionOpen: true, createCollectionData: data || null }),
  closeCreateCollection: () => set({ isCreateCollectionOpen: false, createCollectionData: null }),

  // Edit Collection Modal
  isEditCollectionOpen: false,
  editCollectionData: null,
  openEditCollection: (data) => set({ isEditCollectionOpen: true, editCollectionData: data }),
  closeEditCollection: () => set({ isEditCollectionOpen: false, editCollectionData: null }),

  // Generic Confirmation Modal
  isConfirmOpen: false,
  confirmData: null,
  openConfirm: (data) => set({ isConfirmOpen: true, confirmData: data }),
  closeConfirm: () => set({ isConfirmOpen: false, confirmData: null }),

  // Genre Modals
  isGenreModalOpen: false,
  genreModalData: null,
  openGenreModal: (data) => set({ isGenreModalOpen: true, genreModalData: data || null }),
  closeGenreModal: () => set({ isGenreModalOpen: false, genreModalData: null }),

  // Author Modals
  isAuthorModalOpen: false,
  authorModalData: null,
  openAuthorModal: (data) => set({ isAuthorModalOpen: true, authorModalData: data || null }),
  closeAuthorModal: () => set({ isAuthorModalOpen: false, authorModalData: null }),

  // Chapter Management
  isManageChapterOpen: false,
  manageChapterData: null,
  openManageChapter: (data) => set({ isManageChapterOpen: true, manageChapterData: data }),
  closeManageChapter: () => set({ isManageChapterOpen: false, manageChapterData: null }),
}));
