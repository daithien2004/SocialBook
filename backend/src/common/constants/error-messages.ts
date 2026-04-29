export enum ErrorMessages {
  // Common
  INVALID_ID = 'Định dạng ID không hợp lệ',
  NOT_FOUND = 'Không tìm thấy tài nguyên',
  PERMISSION_DENIED = 'Bạn không có quyền thực hiện hành động này',
  SEARCH_REQUIRED = 'Vui lòng nhập từ khóa tìm kiếm',

  // User
  USER_NOT_FOUND = 'Không tìm thấy người dùng',
  EMAIL_EXISTS = 'Email này đã tồn tại trong hệ thống',
  USERNAME_TAKEN = 'Tên đăng nhập đã được sử dụng',

  // File/Image
  IMAGE_REQUIRED = 'Vui lòng tải lên tệp hình ảnh',
  FILE_NOT_IMAGE = 'Tệp tải lên phải là hình ảnh',
  IMAGE_TOO_LARGE = 'Kích thước ảnh quá lớn (tối đa 5MB)',

  // Book
  BOOK_NOT_FOUND = 'Không tìm thấy sách',

  // Chapter
  CHAPTER_NOT_FOUND = 'Không tìm thấy chương',
  CHAPTER_MISSING_BOOK = 'Chương thiếu thông tin tham chiếu sách',
  NO_CHAPTERS_FOUND = 'Không tìm thấy chương nào cho cuốn sách này',

  // Review
  REVIEW_NOT_FOUND = 'Không tìm thấy đánh giá',
  REVIEW_ALREADY_EXISTS = 'Bạn đã đánh giá cuốn sách này rồi',
  REVIEW_CREATE_FAILED = 'Tạo đánh giá thất bại',
  REVIEW_UPDATE_FORBIDDEN = 'Bạn không có quyền cập nhật đánh giá này',
  REVIEW_DELETE_FORBIDDEN = 'Bạn không có quyền xóa đánh giá này',

  // Post
  POST_NOT_FOUND = 'Không tìm thấy bài viết',
  POST_UPDATE_FORBIDDEN = 'Bạn không có quyền cập nhật bài viết này',
  POST_DELETE_FORBIDDEN = 'Bạn không có quyền xóa bài viết này',

  // Comment
  COMMENT_NOT_FOUND = 'Không tìm thấy bình luận',
  PARENT_COMMENT_NOT_FOUND = 'Không tìm thấy bình luận cha',
  COMMENT_UPDATE_FORBIDDEN = 'Bạn không có quyền cập nhật bình luận này',
  COMMENT_DELETE_FORBIDDEN = 'Bạn không có quyền xóa bình luận này',

  // Author
  AUTHOR_NOT_FOUND = 'Không tìm thấy tác giả',
  AUTHOR_EXISTS = 'Tác giả với tên này đã tồn tại',

  // Genre
  GENRE_NOT_FOUND = 'Không tìm thấy thể loại',
  GENRE_EXISTS = 'Thể loại với tên này đã tồn tại',

  // Collection
  COLLECTION_NOT_FOUND = 'Không tìm thấy bộ sưu tập',

  // Follow
  FOLLOW_USER_NOT_FOUND = 'Không tìm thấy người dùng để theo dõi',
  CANNOT_FOLLOW_SELF = 'Bạn không thể tự theo dõi chính mình',

  // Auth
  INVALID_CREDENTIALS = 'Email hoặc mật khẩu không chính xác',
  TOKEN_EXPIRED = 'Phiên đăng nhập đã hết hạn',
  TOKEN_INVALID = 'Mã xác thực không hợp lệ',

  // TTS
  TTS_UPDATE_FAILED = 'Cập nhật bản ghi TTS thất bại',
  TTS_API_KEY_NOT_FOUND = 'Không tìm thấy API key của VoiceRSS',
  TTS_API_ERROR = 'Lỗi từ API VoiceRSS',

  // Onboarding
  ONBOARDING_NOT_FOUND = 'Không tìm thấy phiên hướng dẫn',
}

export enum SuccessMessages {
  CREATED = 'Tạo thành công',
  UPDATED = 'Cập nhật thành công',
  DELETED = 'Xóa thành công',
}
