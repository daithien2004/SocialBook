import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import {
  Star,
  Eye,
  Heart,
  BookOpen,
  MessageCircle,
  Share2,
  Bookmark,
} from 'lucide-react';
import { Header } from '@/src/components/Header';

// Mock data - trong thực tế sẽ fetch từ database
const booksData = {
  '1': {
    id: '1',
    title: "The Dark Prince's Redemption",
    author: 'Sarah Chen',
    cover: '/dark-prince-fantasy-book-cover.jpg',
    description:
      'In a realm where shadows dance with light, Prince Kael must confront his dark past to save the kingdom he once sought to destroy. A tale of redemption, love, and the power of choice that will keep you turning pages until dawn.',
    fullDescription:
      "Prince Kael has lived in the shadows for centuries, cursed by his own choices and haunted by the lives he's taken. When a mysterious plague threatens to consume his homeland, he must ally with the very people he once terrorized. Alongside Lyra, a fierce warrior with secrets of her own, Kael embarks on a perilous journey that will test not only his newfound resolve but also his capacity for love and forgiveness.\n\nThis epic fantasy weaves together elements of dark magic, political intrigue, and heart-wrenching romance. As Kael struggles to overcome his demons, readers will be drawn into a richly imagined world where nothing is as it seems and redemption comes at the highest price.",
    genre: ['Fantasy', 'Romance', 'Dark Fantasy'],
    rating: 4.8,
    totalRatings: 12847,
    views: 2847392,
    likes: 45821,
    chapters: 45,
    status: 'Completed',
    publishedDate: '2023-08-15',
    lastUpdated: '2024-01-20',
    language: 'Vietnamese',
    tags: [
      'Prince',
      'Redemption',
      'Magic',
      'Romance',
      'Dark',
      'Fantasy',
      'Adventure',
    ],
    ageRating: '16+',
    readingTime: '8h 30m',
  },
  '2': {
    id: '2',
    title: "CEO's Secret Love",
    author: 'Emma Wilson',
    cover: '/modern-romance-ceo-book-cover.jpg',
    description:
      'When ambitious marketing executive Mia crosses paths with the mysterious CEO Alexander Stone, sparks fly in this contemporary romance filled with passion, secrets, and corporate intrigue.',
    fullDescription:
      "Mia Rodriguez has worked her entire career to prove herself in the cutthroat world of corporate marketing. When she's assigned to the biggest campaign of her life, she never expected to clash with Alexander Stone, the enigmatic CEO whose reputation precedes him.\n\nBehind Alexander's cold exterior lies a man haunted by his past, determined to protect his company and his heart at all costs. But Mia's fierce determination and unexpected vulnerability begin to crack the walls he's built around himself.\n\nAs their professional relationship evolves into something deeper, they must navigate office politics, family expectations, and their own fears. Will their love survive the pressures of the corporate world, or will their secrets tear them apart?",
    genre: ['Romance', 'Contemporary', 'CEO'],
    rating: 4.6,
    totalRatings: 8934,
    views: 1234567,
    likes: 28394,
    chapters: 32,
    status: 'Ongoing',
    publishedDate: '2024-02-10',
    lastUpdated: '2024-03-15',
    language: 'Vietnamese',
    tags: [
      'CEO',
      'Office Romance',
      'Contemporary',
      'Billionaire',
      'Enemies to Lovers',
    ],
    ageRating: '18+',
    readingTime: '6h 15m',
  },
  '3': {
    id: '3',
    title: 'Magic Academy Chronicles',
    author: 'David Kim',
    cover: '/magic-school-fantasy-book-cover.jpg',
    description:
      'Join Elena as she discovers her magical abilities and navigates the challenges of Arcanum Academy, where friendship, rivalry, and ancient mysteries await at every turn.',
    fullDescription:
      "Elena Blackwood thought she was just an ordinary teenager until the day she accidentally set her chemistry lab on fire with her bare hands. Now, she finds herself at Arcanum Academy, a hidden school for young mages where she must learn to control powers she never knew she possessed.\n\nBut Arcanum is more than just a school—it's a place where ancient secrets lie buried, where students compete for prestige and power, and where Elena discovers she's connected to a prophecy that could change the magical world forever.\n\nWith her loyal friends Marcus and Zara by her side, Elena must navigate magical classes, dangerous rivals, and the growing darkness that threatens to consume everything she holds dear. As she uncovers the truth about her heritage, she realizes that her greatest enemy might be closer than she ever imagined.",
    genre: ['Fantasy', 'Young Adult', 'Magic'],
    rating: 4.7,
    totalRatings: 15672,
    views: 3456789,
    likes: 67234,
    chapters: 28,
    status: 'Ongoing',
    publishedDate: '2023-11-05',
    lastUpdated: '2024-03-18',
    language: 'Vietnamese',
    tags: [
      'Magic School',
      'Academy',
      'Friendship',
      'Coming of Age',
      'Prophecy',
    ],
    ageRating: '13+',
    readingTime: '5h 45m',
  },
};

const reviews = [
  {
    id: 1,
    user: 'BookLover2024',
    image: '/diverse-user-avatars.png',
    rating: 5,
    comment:
      "Absolutely incredible! The character development is phenomenal and I couldn't put it down.",
    date: '2024-03-10',
    likes: 234,
  },
  {
    id: 2,
    user: 'FantasyFan',
    image: '/placeholder-77uol.png',
    rating: 5,
    comment:
      'This book exceeded all my expectations. The world-building is so detailed and immersive!',
    date: '2024-03-08',
    likes: 189,
  },
  {
    id: 3,
    user: 'ReadingAddict',
    image: '/placeholder-70hgs.png',
    rating: 4,
    comment:
      "Great story with amazing plot twists. Can't wait for the next chapter!",
    date: '2024-03-05',
    likes: 156,
  },
];

interface BookDetailProps {
  params: {
    id: string;
  };
}

export default function BookDetail({ params }: BookDetailProps) {
  const book = booksData[params.id as keyof typeof booksData];

  if (!book) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 mt-12">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Book Cover */}
          <div className="lg:col-span-1">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <Image
                src={book.cover || '/placeholder.svg'}
                alt={book.title}
                width={400}
                height={600}
                className="relative w-full max-w-md mx-auto rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Book Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
                {book.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                Tác giả:{' '}
                <span className="text-primary font-semibold">
                  {book.author}
                </span>
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {book.genre.map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {genre}
                  </Badge>
                ))}
                <Badge variant="outline" className="border-accent text-accent">
                  {book.ageRating}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    book.status === 'Completed'
                      ? 'border-green-500 text-green-600'
                      : 'border-blue-500 text-blue-600'
                  }
                >
                  {book.status === 'Completed' ? 'Hoàn thành' : 'Đang cập nhật'}
                </Badge>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {book.description}
              </p>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Bắt đầu đọc
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Thêm vào yêu thích
                </Button>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Bookmark className="w-4 h-4" />
                    Lưu
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Share2 className="w-4 h-4" />
                    Chia sẻ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-yellow-500 mr-1" />
                <span className="text-2xl font-bold text-foreground">
                  {book.rating}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {book.totalRatings.toLocaleString()} đánh giá
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="w-6 h-6 text-accent mr-1" />
                <span className="text-2xl font-bold text-foreground">
                  {(book.views / 1000000).toFixed(1)}M
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Lượt xem</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="w-6 h-6 text-red-500 mr-1" />
                <span className="text-2xl font-bold text-foreground">
                  {(book.likes / 1000).toFixed(0)}K
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Yêu thích</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="w-6 h-6 text-blue-500 mr-1" />
                <span className="text-2xl font-bold text-foreground">
                  {book.chapters}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Chương</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Mô tả chi tiết
                </h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  {book.fullDescription
                    .split('\n\n')
                    .map((paragraph, index) => (
                      <p key={index} className="mb-4 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    Đánh giá từ độc giả
                  </h2>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Viết đánh giá
                  </Button>
                </div>

                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-border/50 pb-6 last:border-b-0"
                    >
                      <div className="flex items-start gap-4">
                        <Image
                          src={review.image || '/placeholder.svg'}
                          alt={review.user}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-foreground">
                              {review.user}
                            </span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-yellow-500 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {review.date}
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-2">
                            {review.comment}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <button className="flex items-center gap-1 hover:text-primary transition-colors">
                              <Heart className="w-4 h-4" />
                              {review.likes}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Book Details */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Chi tiết sách
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngôn ngữ:</span>
                    <span className="text-foreground">{book.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Thời gian đọc:
                    </span>
                    <span className="text-foreground">{book.readingTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Xuất bản:</span>
                    <span className="text-foreground">
                      {new Date(book.publishedDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cập nhật:</span>
                    <span className="text-foreground">
                      {new Date(book.lastUpdated).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Thẻ
                </h3>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-muted hover:bg-muted/80"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Related Books */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Sách liên quan
                </h3>
                <div className="space-y-4">
                  {Object.values(booksData)
                    .filter((b) => b.id !== book.id)
                    .slice(0, 3)
                    .map((relatedBook) => (
                      <Link
                        key={relatedBook.id}
                        href={`/book/${relatedBook.id}`}
                        className="block group"
                      >
                        <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <Image
                            src={relatedBook.cover || '/placeholder.svg'}
                            alt={relatedBook.title}
                            width={60}
                            height={80}
                            className="rounded-md group-hover:scale-105 transition-transform"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                              {relatedBook.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {relatedBook.author}
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-muted-foreground">
                                {relatedBook.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
