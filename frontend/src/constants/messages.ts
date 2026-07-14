export const MESSAGES = {
  // Authentication & Authorization
  REQUIRE_LOGIN: 'Vui lòng đăng nhập để thực hiện chức năng này',
  LOGIN_SUCCESS: 'Đăng nhập thành công!',
  LOGIN_FAILED: 'Đăng nhập thất bại, vui lòng kiểm tra lại thông tin',
  LOGOUT_SUCCESS: 'Đăng xuất thành công!',
  ACCESS_DENIED: 'Bạn không có quyền truy cập trang này',

  // Generic Actions
  SAVE_SUCCESS: 'Lưu thay đổi thành công!',
  SAVE_FAILED: 'Lưu thay đổi thất bại, vui lòng thử lại',
  DELETE_SUCCESS: 'Xóa thành công!',
  DELETE_FAILED: 'Xóa thất bại, vui lòng thử lại',
  LOAD_FAILED: 'Tải dữ liệu thất bại, vui lòng thử lại',
  UNKNOWN_ERROR: 'Đã có lỗi xảy ra. Vui lòng thử lại.',

  // Feature specific
  POST_CREATE_SUCCESS: 'Đăng bài viết thành công!',
  POST_UPDATE_SUCCESS: 'Cập nhật bài viết thành công!',
  POST_DELETE_SUCCESS: 'Xóa bài viết thành công!',
  POST_IMAGE_DELETE_SUCCESS: 'Xóa ảnh thành công!',
  
  COMMENT_CREATE_SUCCESS: 'Bình luận đã được gửi!',
  COMMENT_UPDATE_SUCCESS: 'Bình luận đã được chỉnh sửa!',
  COMMENT_DELETE_SUCCESS: 'Bình luận đã được xóa!',

  FOLLOW_TOGGLE_FAILED: 'Không thể thay đổi trạng thái theo dõi',

  BOOK_ADD_LIBRARY: 'Đã thêm sách vào thư viện!',
  BOOK_REMOVE_LIBRARY: 'Đã xóa sách khỏi thư viện!',
  
  COLLECTION_CREATE_SUCCESS: 'Tạo bộ sưu tập thành công!',
  COLLECTION_UPDATE_SUCCESS: 'Cập nhật bộ sưu tập thành công!',
  COLLECTION_DELETE_SUCCESS: 'Xóa bộ sưu tập thành công!',

  IMAGE_SIZE_ERROR: 'Kích thước ảnh không được vượt quá 5MB',
  IMAGE_TYPE_ERROR: 'Vui lòng chọn đúng định dạng file ảnh',
} as const;
