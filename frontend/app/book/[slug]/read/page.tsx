"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BOOKS_ENDPOINTS } from "@/constants/api"
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Bookmark,
  Share2,
  MessageCircle,
  X,
  Sun,
  Moon,
  Minus,
  Plus,
  RotateCcw,
  Loader2,
} from "lucide-react"

interface Book {
  _id: string
  title: string
  slug: string
  description: string
  coverUrl: string
  status: string
  tags: string[]
  views: number
  likes: number
  publishedYear: string
  authorId: string
  genre: string[]
}

interface Chapter {
  _id: string
  bookId?: string
  title: string
  content?: string
  viewsCount?: number
  orderIndex: number
}

interface BookData {
  book: Book
  firstChapter: Chapter
  allIndex: Chapter[]
}

interface NextChapterData {
  _id: string
  title: string
  orderIndex: number
}

interface ChapterContent {
  _id: string
  content: string
}

export default function ReadingPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [bookData, setBookData] = useState<BookData | null>(null)
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [currentChapterContent, setCurrentChapterContent] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [loadingNextChapter, setLoadingNextChapter] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [preloadedNextChapter, setPreloadedNextChapter] = useState<NextChapterData | null>(null)
  const [preloadedNextContent, setPreloadedNextContent] = useState<string | null>(null)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)

  const slug = params.slug as string
  const chapterParam = searchParams.get("chapter") || "1"
  const currentChapterIndex = Number.parseInt(chapterParam)

  const fetchBookData = async (bookSlug: string) => {
    try {
      const response = await fetch(BOOKS_ENDPOINTS.bookAndFirstChapter(bookSlug))
      if (!response.ok) throw new Error("Failed to fetch book data")
      const data: BookData = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching book data:", error)
      throw error
    }
  }

  const fetchNextChapter = async (bookSlug: string, currentOrderIndex: number) => {
    try {
      const response = await fetch(
        BOOKS_ENDPOINTS.getMetadataNextChapter(bookSlug, currentOrderIndex),
      )
      if (!response.ok) throw new Error("Failed to fetch next chapter")
      const data: NextChapterData = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching next chapter:", error)
      throw error
    }
  }

  const fetchChapterContent = async (chapterId: string) => {
    try {
      const response = await fetch(BOOKS_ENDPOINTS.chapterContent(chapterId))
      if (!response.ok) throw new Error("Failed to fetch chapter content")
      const data: ChapterContent = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching chapter content:", error)
      throw error
    }
  }

  const preloadNextChapter = async (bookSlug: string, currentOrderIndex: number) => {
    try {
      const nextChapterData = await fetchNextChapter(bookSlug, currentOrderIndex)
      setPreloadedNextChapter(nextChapterData)

      // Also preload the content
      const contentData = await fetchChapterContent(nextChapterData._id)
      setPreloadedNextContent(contentData.content)
    } catch (error) {
      console.error("Error preloading next chapter:", error)
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)

        // API 1: Get book data and first chapter
        const data = await fetchBookData(slug)
        setBookData(data)

        // Find current chapter based on URL parameter
        const targetChapter = data.allIndex.find((ch) => ch.orderIndex === currentChapterIndex) || data.firstChapter
        setCurrentChapter(targetChapter)

        // Set content based on chapter
        if (currentChapterIndex === 1) {
          setCurrentChapterContent(data.firstChapter.content || "")
        } else {
          // Fetch content for other chapters
          const contentData = await fetchChapterContent(targetChapter._id)
          setCurrentChapterContent(contentData.content)
        }

        // Preload next chapter for smooth navigation
        if (currentChapterIndex < data.allIndex.length) {
          await preloadNextChapter(slug, currentChapterIndex)
        }
      } catch (error) {
        setError("Không thể tải dữ liệu sách. Vui lòng thử lại.")
        console.error("Error loading initial data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [slug, currentChapterIndex])

  // Simulate reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100
      setReadingProgress(Math.min(progress, 100))
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handlePreviousChapter = () => {
    if (currentChapterIndex > 1) {
      router.push(`/book/${slug}/read?chapter=${currentChapterIndex - 1}`)
    }
  }

  const handleNextChapter = async () => {
    if (!bookData || !currentChapter) return

    try {
      setLoadingNextChapter(true)

      let nextChapterData: NextChapterData
      let nextContent: string

      // Use preloaded data if available
      if (preloadedNextChapter && preloadedNextContent) {
        nextChapterData = preloadedNextChapter
        nextContent = preloadedNextContent
      } else {
        // Fallback to API calls
        nextChapterData = await fetchNextChapter(slug, currentChapterIndex)
        const contentData = await fetchChapterContent(nextChapterData._id)
        nextContent = contentData.content
      }

      // Update current chapter and content
      setCurrentChapter(nextChapterData)
      setCurrentChapterContent(nextContent)

      // Update URL
      router.push(`/book/${slug}/read?chapter=${nextChapterData.orderIndex}`)

      // Preload next chapter for future navigation
      if (nextChapterData.orderIndex < bookData.allIndex.length) {
        await preloadNextChapter(slug, nextChapterData.orderIndex)
      }
    } catch (error) {
      console.error("Error loading next chapter:", error)
      setError("Không thể tải chương tiếp theo. Vui lòng thử lại.")
    } finally {
      setLoadingNextChapter(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải sách...</p>
        </div>
      </div>
    )
  }

  if (error || !bookData || !currentChapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Không tìm thấy sách"}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className={`min-h-screen mt-12 transition-colors duration-300 ${isDarkMode ? "bg-gray-900 text-white" : "bg-background text-foreground"
          }`}
      >

        {/* Reading Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-50">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Header */}
        <header className="sticky top-1 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="container mx-auto px-3 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={`/book/${slug}`}>
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Quay lại
                  </Button>
                </Link>
                <div className="hidden md:block">
                  <h1 className="font-semibold text-lg">{bookData.book.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    Chương {currentChapter.orderIndex} / {bookData.allIndex.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={isBookmarked ? "text-primary" : ""}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsCommentsOpen(!isCommentsOpen)}>
                  <MessageCircle className="w-4 h-4" />
                  <span className="ml-1 text-xs">0</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Chapter Navigation */}
              <div className="flex items-center justify-between mb-8 p-4 bg-card rounded-lg border">
                <Button
                  variant="outline"
                  onClick={handlePreviousChapter}
                  disabled={currentChapter.orderIndex === 1}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Chương trước
                </Button>

                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">
                    Chương {currentChapter.orderIndex}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {currentChapter.orderIndex} / {bookData.allIndex.length}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleNextChapter}
                  disabled={currentChapter.orderIndex === bookData.allIndex.length || loadingNextChapter}
                  className="flex items-center gap-2 bg-transparent"
                >
                  {loadingNextChapter ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Chương tiếp
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Story Content */}
              <Card className="mb-8">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">{currentChapter.title}</h2>
                  <div
                    className="prose prose-lg max-w-none leading-relaxed"
                    style={{ fontSize: `${fontSize}px`, lineHeight: "1.8" }}
                  >
                    {currentChapterContent.split("\n").map(
                      (paragraph, index) =>
                        paragraph.trim() && (
                          <p key={index} className="mb-4">
                            {paragraph.trim()}
                          </p>
                        ),
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
                <Button
                  variant="outline"
                  onClick={handlePreviousChapter}
                  disabled={currentChapter.orderIndex === 1}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Chương trước
                </Button>

                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Bình luận (0)
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Chia sẻ
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={handleNextChapter}
                  disabled={currentChapter.orderIndex === bookData.allIndex.length || loadingNextChapter}
                  className="flex items-center gap-2 bg-transparent"
                >
                  {loadingNextChapter ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Chương tiếp
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Book Info */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={bookData.book.coverUrl || "/placeholder.svg"}
                        alt={bookData.book.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div>
                        <h3 className="font-semibold text-sm">{bookData.book.title}</h3>
                        <p className="text-xs text-muted-foreground">Tác giả</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Tiến độ:</span>
                        <span>{Math.round(readingProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${readingProgress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Chapter List */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Danh sách chương</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {bookData.allIndex.map((chapter) => (
                        <Link
                          key={chapter._id}
                          href={`/book/${slug}/read?chapter=${chapter.orderIndex}`}
                          className={`block p-2 rounded text-sm hover:bg-accent transition-colors ${chapter.orderIndex === currentChapter.orderIndex ? "bg-primary text-primary-foreground" : ""
                            }`}
                        >
                          {chapter.title}
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Cài đặt đọc</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Font Size */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Kích thước chữ</label>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm" onClick={() => setFontSize(Math.max(12, fontSize - 2))}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium w-12 text-center">{fontSize}px</span>
                      <Button variant="outline" size="sm" onClick={() => setFontSize(Math.min(24, fontSize + 2))}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Theme */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Chế độ hiển thị</label>
                    <div className="flex gap-2">
                      <Button
                        variant={!isDarkMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsDarkMode(false)}
                        className="flex-1"
                      >
                        <Sun className="w-4 h-4 mr-2" />
                        Sáng
                      </Button>
                      <Button
                        variant={isDarkMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsDarkMode(true)}
                        className="flex-1"
                      >
                        <Moon className="w-4 h-4 mr-2" />
                        Tối
                      </Button>
                    </div>
                  </div>

                  {/* Reset */}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      setFontSize(16)
                      setIsDarkMode(false)
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Đặt lại mặc định
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Comments Panel */}
        {isCommentsOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Bình luận (0)</h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsCommentsOpen(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="text-center text-muted-foreground">Chưa có bình luận nào</div>
                </div>

                <div className="p-6 border-t">
                  <div className="flex gap-3">
                    <img src="/placeholder-user.jpg" alt="You" className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1">
                      <textarea
                        placeholder="Viết bình luận của bạn..."
                        className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <Button size="sm">Gửi bình luận</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
