import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Star, Eye, Heart, BookOpen, MessageCircle, Share2, Bookmark } from "lucide-react"

// Mock data - trong thực tế sẽ fetch từ database
const booksData = {
  "the-dark-princes-redemption": {
    id: "1",
    title: "The Dark Prince's Redemption",
    author: "Sarah Chen",
    cover: "/young-detective-mystery-book.jpg",
    description:
      "In a realm where shadows dance with light, Prince Kael must confront his dark past to save the kingdom he once sought to destroy. A tale of redemption, love, and the power of choice that will keep you turning pages until dawn.",
    fullDescription:
      "Prince Kael has lived in the shadows for centuries, cursed by his own choices and haunted by the lives he's taken. When a mysterious plague threatens to consume his homeland, he must ally with the very people he once terrorized. Alongside Lyra, a fierce warrior with secrets of her own, Kael embarks on a perilous journey that will test not only his newfound resolve but also his capacity for love and forgiveness.\n\nThis epic fantasy weaves together elements of dark magic, political intrigue, and heart-wrenching romance. As Kael struggles to overcome his demons, readers will be drawn into a richly imagined world where nothing is as it seems and redemption comes at the highest price.",
    genre: ["Fantasy", "Romance", "Dark Fantasy"],
    rating: 4.8,
    totalRatings: 12847,
    views: 2847392,
    likes: 45821,
    chapters: 45,
    status: "Completed",
    publishedDate: "2023-08-15",
    lastUpdated: "2024-01-20",
    language: "Vietnamese",
    tags: ["Prince", "Redemption", "Magic", "Romance", "Dark", "Fantasy", "Adventure"],
    ageRating: "16+",
    readingTime: "8h 30m",
  },
}

const reviews = [
  {
    id: 1,
    user: "BookLover2024",
    avatar: "/diverse-user-avatars.png",
    rating: 5,
    comment: "Absolutely incredible! The character development is phenomenal and I couldn't put it down.",
    date: "2024-03-10",
    likes: 234,
  },
  {
    id: 2,
    user: "FantasyFan",
    avatar: "/placeholder-77uol.png",
    rating: 5,
    comment: "This book exceeded all my expectations. The world-building is so detailed and immersive!",
    date: "2024-03-08",
    likes: 189,
  },
  {
    id: 3,
    user: "ReadingAddict",
    avatar: "/placeholder-70hgs.png",
    rating: 4,
    comment: "Great story with amazing plot twists. Can't wait for the next chapter!",
    date: "2024-03-05",
    likes: 156,
  },
]

interface BookDetailProps {
  params: {
    slug: string
  }
}

export default function BookDetail({ params }: BookDetailProps) {
  const book = booksData[params.slug as keyof typeof booksData]

  if (!book) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white-50 mx-50 mt-20">
      <div className="container mx-auto px-4 py-8">

        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Book Cover */}
          <div className="lg:w-1/4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <Image
                src={book.cover || "/placeholder.svg"}
                alt={book.title}
                width={200}
                height={300}
                className="relative object-cover w-full max-w-md mx-auto rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Book Info */}
          <div className="lg:w-2/3 space-y-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">{book.title}</h1>
              <p className="text-xl text-gray-600 mb-4">
                Tác giả: <span className="text-orange-600 font-semibold">{book.author}</span>
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {book.genre.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium"
                  >
                    {genre}
                  </span>
                ))}
                <span className="px-3 py-1 border border-orange-500 text-orange-600 rounded-full text-sm">
                  {book.ageRating}
                </span>
                <span className={`px-3 py-1 border rounded-full text-sm ${book.status === "Completed"
                    ? "border-green-500 text-green-600"
                    : "border-blue-500 text-blue-600"
                  }`}>
                  {book.status === "Completed" ? "Hoàn thành" : "Đang cập nhật"}
                </span>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed mb-6">{book.description}</p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex items-center justify-center bg-gradient-to-r from-yellow-500 to-orange-400 
                                hover:from-yellow-700 hover:to-orange-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Bắt đầu đọc
                </button>
                <button className="flex items-center justify-center border border-pink-400 text-pink-600 hover:bg-pink-600 hover:text-white px-8 py-3 rounded-xl transition-colors duration-300">
                  <Heart className="w-5 h-5 mr-2" />
                  Thêm vào yêu thích
                </button>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-gray-500 hover:text-white hover:bg-gradient-to-r hover:from-cyan-400 hover:to-sky-400 hover:font-bold px-4 py-2 rounded-lg transition-all">
                    <Bookmark className="w-4 h-4 " />
                    Lưu
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-white hover:bg-gradient-to-r hover:from-cyan-400 hover:to-sky-400 hover:font-bold px-4 py-2 rounded-lg transition-all">
                    <Share2 className="w-4 h-4" />
                    Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {/* Rating Card */}
          <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 rounded-lg hover:shadow-lg transition-shadow p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-yellow-500 mr-1" />
              <span className="text-2xl font-bold text-gray-900">{book.rating}</span>
            </div>
            <p className="text-sm text-gray-600">{book.totalRatings.toLocaleString()} đánh giá</p>
          </div>

          {/* Views Card */}
          <div className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border border-purple-500/20 rounded-lg hover:shadow-lg transition-shadow p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Eye className="w-6 h-6 text-purple-500 mr-1" />
              <span className="text-2xl font-bold text-gray-900">{(book.views / 1000000).toFixed(1)}M</span>
            </div>
            <p className="text-sm text-gray-600">Lượt xem</p>
          </div>

          {/* Likes Card */}
          <div className="bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20 rounded-lg hover:shadow-lg transition-shadow p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Heart className="w-6 h-6 text-red-500 mr-1" />
              <span className="text-2xl font-bold text-gray-900">{(book.likes / 1000).toFixed(0)}K</span>
            </div>
            <p className="text-sm text-gray-600">Yêu thích</p>
          </div>

          {/* Chapters Card */}
          <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20 rounded-lg hover:shadow-lg transition-shadow p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 text-green-500 mr-1" />
              <span className="text-2xl font-bold text-gray-900">{book.chapters}</span>
            </div>
            <p className="text-sm text-gray-600">Chương</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3 space-y-8">
            {/* Description */}
            <div className="bg-yellow-50 backdrop-blur-sm rounded-lg border border-neutral-500 border-2">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả chi tiết</h2>
                <div className="text-gray-700">
                  {book.fullDescription.split("\n\n").map((paragraph, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-yellow-50 backdrop-blur-sm rounded-lg border border-neutral-500 border-2">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Đánh giá từ độc giả</h2>
                  <button className="flex items-center border-2 border-amber-200 text-yellow-800 px-4 py-2 hover:bg-amber-300 rounded-lg transition-colors">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Viết đánh giá
                  </button>
                </div>

                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-neutral-500 border-2/50 pb-6 last:border-b-0">
                      <div className="flex items-start gap-4">
                        <Image
                          src={review.avatar || "/placeholder.svg"}
                          alt={review.user}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{review.user}</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          <p className="text-gray-700 mb-2">{review.comment}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <button className="flex items-center gap-1 hover:text-pink-600 transition-colors">
                              <Heart className="w-4 h-4" />
                              {review.likes}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3 space-y-6">
            {/* Book Details */}
            <div className="bg-yellow-50 backdrop-blur-sm rounded-lg  border-neutral-500 border-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết sách</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngôn ngữ:</span>
                    <span className="text-gray-900">{book.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian đọc:</span>
                    <span className="text-gray-900">{book.readingTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Xuất bản:</span>
                    <span className="text-gray-900">{new Date(book.publishedDate).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cập nhật:</span>
                    <span className="text-gray-900">{new Date(book.lastUpdated).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-yellow-50 backdrop-blur-sm rounded-lg  border-neutral-500 border-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thẻ</h3>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1  text-gray-700 rounded-full text-sm hover:bg-orange-200 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Related Books */}
            <div className="bg-amber-50 backdrop-blur-sm rounded-lg  border-neutral-500 border-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sách liên quan</h3>
                <div className="space-y-4">
                  {Object.values(booksData)
                    .filter((b) => b.id !== book.id)
                    .slice(0, 3)
                    .map((relatedBook) => (
                      <Link key={relatedBook.id} href={`/book/${relatedBook.id}`} className="block group">
                        <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <Image
                            src={relatedBook.cover || "/placeholder.svg"}
                            alt={relatedBook.title}
                            width={60}
                            height={80}
                            className="rounded-md group-hover:scale-105 transition-transform"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {relatedBook.title}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">{relatedBook.author}</p>
                            <div className="flex items-center gap-1 mt-2">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-gray-600">{relatedBook.rating}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}