import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { BookCarousel } from "@/components/book-carousel"
import { TrendingStories } from "@/components/trending-stories"
import { BookOpen } from "lucide-react" // Declare the BookOpen variable
// Sample book data
const featuredBooks = [
  {
    id: "1",
    title: "Thế Giới Phép Thuật",
    author: "Nguyễn Văn A",
    cover: "/fantasy-magic-world-book-cover.jpg",
    rating: 4.8,
    reads: "2.1M",
    genre: "Fantasy",
    description: "Một thế giới đầy phép thuật và những cuộc phiêu lưu kỳ thú đang chờ đón bạn...",
    isNew: true,
    isTrending: true,
  },
  {
    id: "2",
    title: "Tình Yêu Tuổi 17",
    author: "Trần Thị B",
    cover: "/teen-romance-book-cover.jpg",
    rating: 4.9,
    reads: "1.8M",
    genre: "Romance",
    description: "Câu chuyện tình yêu ngọt ngào của tuổi học trò với những cung bậc cảm xúc...",
    isNew: false,
    isTrending: true,
  },
  {
    id: "3",
    title: "Kiếm Hiệp Giang Hồ",
    author: "Lê Văn C",
    cover: "/martial-arts-swordsman-book.jpg",
    rating: 4.7,
    reads: "1.5M",
    genre: "Võ hiệp",
    description: "Hành trình trở thành cao thủ võ lâm của một chàng trai trẻ...",
    isNew: true,
    isTrending: false,
  },
  {
    id: "4",
    title: "Bí Ẩn Thành Phố",
    author: "Phạm Thị D",
    cover: "/mystery-city-detective-book.jpg",
    rating: 4.6,
    reads: "1.2M",
    genre: "Mystery",
    description: "Những vụ án bí ẩn trong thành phố lớn và cuộc truy tìm sự thật...",
    isNew: false,
    isTrending: true,
  },
  {
    id: "5",
    title: "Công Chúa Rồng",
    author: "Hoàng Văn E",
    cover: "/dragon-princess-fantasy-book.jpg",
    rating: 4.8,
    reads: "980K",
    genre: "Fantasy",
    description: "Cuộc phiêu lưu của công chúa rồng trong thế giới thần thoại...",
    isNew: true,
    isTrending: false,
  },
]

const newBooks = [
  {
    id: "6",
    title: "Học Viện Siêu Năng Lực",
    author: "Vũ Thị F",
    cover: "/superhero-academy-book-cover.jpg",
    rating: 4.5,
    reads: "850K",
    genre: "Sci-Fi",
    description: "Trường học dành cho những người có siêu năng lực đặc biệt...",
    isNew: true,
    isTrending: false,
  },
  {
    id: "7",
    title: "Nàng Tiên Cá",
    author: "Đỗ Văn G",
    cover: "/mermaid-fantasy-book-cover.jpg",
    rating: 4.7,
    reads: "720K",
    genre: "Fantasy",
    description: "Câu chuyện về nàng tiên cá và cuộc tình với hoàng tử...",
    isNew: true,
    isTrending: true,
  },
  {
    id: "8",
    title: "Thám Tử Nhí",
    author: "Bùi Thị H",
    cover: "/young-detective-mystery-book.jpg",
    rating: 4.4,
    reads: "650K",
    genre: "Mystery",
    description: "Những vụ án được giải quyết bởi thám tử nhí thông minh...",
    isNew: true,
    isTrending: false,
  },
  {
    id: "9",
    title: "Chiến Binh Ánh Sáng",
    author: "Ngô Văn I",
    cover: "/light-warrior-fantasy-book.jpg",
    rating: 4.6,
    reads: "580K",
    genre: "Fantasy",
    description: "Cuộc chiến giữa ánh sáng và bóng tối trong thế giới fantasy...",
    isNew: true,
    isTrending: true,
  },
  {
    id: "10",
    title: "Tình Yêu Văn Phòng",
    author: "Lý Thị J",
    cover: "/placeholder.svg?height=400&width=300",
    rating: 4.3,
    reads: "520K",
    genre: "Romance",
    description: "Chuyện tình lãng mạn nơi công sở giữa sếp và nhân viên...",
    isNew: true,
    isTrending: false,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">

      <main>
        <HeroSection />

        <div className="space-y-16">
          <BookCarousel title="Truyện Nổi Bật" books={featuredBooks} variant="featured" />

          <TrendingStories />

          <BookCarousel title="Truyện Mới Cập Nhật" books={newBooks} variant="new" />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              BookVerse
            </h3>
          </div>
          <p className="text-muted-foreground mb-8 text-balance">Nền tảng đọc sách trực tuyến hàng đầu Việt Nam</p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Về chúng tôi
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Điều khoản
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Bảo mật
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Liên hệ
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Hỗ trợ
            </a>
          </div>
          <div className="mt-8 pt-8 border-t text-sm text-muted-foreground">
            © 2024 BookVerse. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </footer>
    </div>
  )
}
