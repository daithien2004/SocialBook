"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Eye, Heart, MessageCircle, TrendingUp, Clock } from "lucide-react"

interface Story {
  id: string
  title: string
  author: string
  excerpt: string
  cover: string
  genre: string
  rating: number
  views: string
  likes: string
  comments: string
  updatedAt: string
  isCompleted: boolean
  chapters: number
}

const trendingStories: Story[] = [
  {
    id: "1",
    title: "Hoàng Tử Bóng Đêm",
    author: "Minh Châu",
    excerpt:
      "Trong thế giới nơi ánh sáng và bóng tối đối lập, một hoàng tử trẻ phải lựa chọn giữa vương quyền và tình yêu...",
    cover: "/dark-prince-fantasy-book-cover.jpg",
    genre: "Fantasy",
    rating: 4.8,
    views: "2.1M",
    likes: "45K",
    comments: "12K",
    updatedAt: "2 giờ trước",
    isCompleted: false,
    chapters: 45,
  },
  {
    id: "2",
    title: "Nữ CEO Và Chàng Thực Tập Sinh",
    author: "Thu Hà",
    excerpt:
      "Khi nữ CEO lạnh lùng gặp chàng thực tập sinh tài năng, liệu tình yêu có thể nảy sinh giữa hai thế giới khác biệt?",
    cover: "/modern-romance-ceo-book-cover.jpg",
    genre: "Romance",
    rating: 4.9,
    views: "1.8M",
    likes: "38K",
    comments: "9K",
    updatedAt: "1 ngày trước",
    isCompleted: true,
    chapters: 60,
  },
  {
    id: "3",
    title: "Trường Học Phép Thuật",
    author: "Đức Minh",
    excerpt: "Một cậu học sinh bình thường bước vào thế giới phép thuật đầy bí ẩn và nguy hiểm...",
    cover: "/magic-school-fantasy-book-cover.jpg",
    genre: "Fantasy",
    rating: 4.7,
    views: "1.5M",
    likes: "32K",
    comments: "8K",
    updatedAt: "3 giờ trước",
    isCompleted: false,
    chapters: 38,
  },
  {
    id: "4",
    title: "Kiếm Sĩ Huyền Thoại",
    author: "Văn Long",
    excerpt: "Hành trình của một kiếm sĩ trẻ trở thành huyền thoại trong thế giới võ lâm đầy thử thách...",
    cover: "/legendary-swordsman-martial-arts-book.jpg",
    genre: "Võ hiệp",
    rating: 4.6,
    views: "1.2M",
    likes: "28K",
    comments: "7K",
    updatedAt: "5 giờ trước",
    isCompleted: false,
    chapters: 52,
  },
  {
    id: "5",
    title: "Công Chúa Băng Giá",
    author: "Lan Anh",
    excerpt: "Câu chuyện về một công chúa có sức mạnh băng giá và cuộc phiêu lưu tìm kiếm bản thân...",
    cover: "/ice-princess-fantasy-book-cover.jpg",
    genre: "Fantasy",
    rating: 4.8,
    views: "980K",
    likes: "25K",
    comments: "6K",
    updatedAt: "1 ngày trước",
    isCompleted: true,
    chapters: 42,
  },
  {
    id: "6",
    title: "Thám Tử Thành Phố",
    author: "Hoàng Nam",
    excerpt: "Những vụ án bí ẩn trong thành phố lớn và cuộc đấu trí giữa thám tử tài ba với tội phạm...",
    cover: "/detective-mystery-city-book-cover.jpg",
    genre: "Mystery",
    rating: 4.5,
    views: "850K",
    likes: "22K",
    comments: "5K",
    updatedAt: "6 giờ trước",
    isCompleted: false,
    chapters: 35,
  },
]

export function TrendingStories() {
  const [selectedGenre, setSelectedGenre] = useState("Tất cả")

  const genres = ["Tất cả", "Fantasy", "Romance", "Võ hiệp", "Mystery"]

  const filteredStories =
    selectedGenre === "Tất cả" ? trendingStories : trendingStories.filter((story) => story.genre === selectedGenre)

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-full mb-4">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">Đang thịnh hành</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 text-balance">Truyện Hot Nhất Tuần</h2>
          <p className="text-xl text-muted-foreground text-balance">
            Những câu chuyện được yêu thích nhất bởi cộng đồng độc giả
          </p>
        </div>

        {/* Genre Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {genres.map((genre) => (
            <Button
              key={genre}
              variant={selectedGenre === genre ? "default" : "outline"}
              onClick={() => setSelectedGenre(genre)}
              className={`rounded-full px-6 py-2 transition-all duration-300 ${
                selectedGenre === genre
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "hover:bg-primary/10 hover:text-primary hover:border-primary"
              }`}
            >
              {genre}
            </Button>
          ))}
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStories.map((story, index) => (
            <Card
              key={story.id}
              className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={story.cover || "/placeholder.svg"}
                    alt={story.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className={`${story.isCompleted ? "bg-green-500" : "bg-blue-500"} text-white`}>
                      {story.isCompleted ? "Hoàn thành" : `${story.chapters} chương`}
                    </Badge>
                  </div>

                  {/* Genre badge */}
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      {story.genre}
                    </Badge>
                  </div>

                  {/* Ranking */}
                  <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    #{index + 1}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2 line-clamp-1 group-hover:text-primary transition-colors text-balance">
                    {story.title}
                  </h3>

                  <p className="text-muted-foreground text-sm mb-3">bởi {story.author}</p>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 text-pretty">{story.excerpt}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{story.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{story.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{story.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{story.comments}</span>
                    </div>
                  </div>

                  {/* Updated time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Cập nhật {story.updatedAt}</span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4"
                    >
                      Đọc ngay
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load more button */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="px-8 py-3 rounded-full border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 bg-transparent"
          >
            Xem thêm truyện hot
          </Button>
        </div>
      </div>
    </section>
  )
}
