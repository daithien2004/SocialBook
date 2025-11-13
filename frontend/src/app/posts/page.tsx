import PostList from "@/src/components/post/PostList";

export default function Post() {
    return (
        <div className="mt-16 flex justify-center gap-4">
            <div className="hidden lg:block w-1/5 bg-gray-50 rounded-2xl p-4 m-4 shadow-sm h-fit sticky top-20">
                <h2 className="font-semibold mb-3">Menu</h2>
                <ul className="space-y-2 text-sm">
                    <li className="hover:text-blue-600 cursor-pointer">Trang chủ</li>
                    <li className="hover:text-blue-600 cursor-pointer">Bạn bè</li>
                    <li className="hover:text-blue-600 cursor-pointer">Nhóm đọc</li>
                    <li className="hover:text-blue-600 cursor-pointer">Thư viện</li>
                </ul>
            </div>

            <div className="w-full lg:w-2/5 bg-white p-4">
                <div className="bg-white rounded-2xl shadow p-4 space-y-4 mb-4 border-2r">
                    <div className="flex items-center space-x-3">
                        <img
                            src="/abstract-book-pattern.png" // Thay đường dẫn ảnh avatar ở đây
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                            <p className="font-semibold text-gray-800">Vinh</p>
                            <p className="text-xs text-gray-500">Đang nghĩ gì?</p>
                        </div>
                    </div>

                    <div>
                          <textarea
                              placeholder="Chia sẻ cảm nhận của bạn về một cuốn sách..."
                              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              rows={1}
                          ></textarea>
                    </div>

                    <div className="flex justify-between items-center border-t pt-3">
                        <div className="flex space-x-4 text-sm text-gray-600">
                            <button className="flex items-center space-x-1 hover:text-blue-600">
                                <span>📷</span>
                                <span>Ảnh</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-blue-600">
                                <span>💬</span>
                                <span>Trích dẫn</span>
                            </button>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                            Đăng
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <PostList/>
                </div>
            </div>

            <div className="hidden lg:block w-1/5 bg-gray-50 rounded-2xl p-4 m-4 shadow-sm h-fit sticky top-20">
                <h2 className="font-semibold mb-3">Đề xuất</h2>
                <ul className="space-y-2 text-sm">
                    <li className="hover:text-blue-600 cursor-pointer">Tác giả nổi bật</li>
                    <li className="hover:text-blue-600 cursor-pointer">Bài viết hay</li>
                    <li className="hover:text-blue-600 cursor-pointer">Nhóm nổi bật</li>
                </ul>
            </div>
        </div>
    );
}
