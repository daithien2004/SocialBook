"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, BookOpen, Users, ChevronLeft, ChevronRight } from "lucide-react"

interface Book {
  id: string
  title: string
  author: string
  cover: string
  rating: number
  reads: string
  genre: string
  description: string
  isNew?: boolean
  isTrending?: boolean
}

interface BookCarouselProps {
  title: string
  books: Book[]
  variant?: "featured" | "trending" | "new"
}

export function BookCarousel({ title, books, variant = "featured" }: BookCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, books.length - 2))
    }, 4000)

    return () => clearInterval(interval)
  }, [books.length, isAutoPlaying])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, books.length - 2))
    setIsAutoPlaying(false)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, books.length - 2)) % Math.max(1, books.length - 2))
    setIsAutoPlaying(false)
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "featured":
        return "bg-gradient-to-r from-primary/10 to-secondary/10"
      case "trending":
        return "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20"
      case "new":
        return "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
      default:
        return "bg-muted/50"
    }
  }

  return (
    <section className={`py-12 px-4 rounded-2xl ${getVariantStyles()}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-balance mb-2">{title}</h2>
            <p className="text-muted-foreground">Khám phá những câu chuyện tuyệt vời</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300 bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out gap-6"
            style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
          >
            {books.map((book, index) => (
              <div key={book.id} className="flex-none w-1/3 min-w-0">
                <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={book.cover || "/placeholder.svg"}
                        alt={book.title}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {book.isNew && <Badge className="bg-green-500 hover:bg-green-600 text-white">Mới</Badge>}
                        {book.isTrending && <Badge className="bg-red-500 hover:bg-red-600 text-white">Hot</Badge>}
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Đọc ngay
                        </Button>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {book.genre}
                        </Badge>
                      </div>

                      <h3 className="font-bold text-lg mb-2 line-clamp-2 text-balance group-hover:text-primary transition-colors">
                        {book.title}
                      </h3>

                      <p className="text-muted-foreground text-sm mb-3">bởi {book.author}</p>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{book.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{book.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{book.reads}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: Math.max(1, books.length - 2) }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setIsAutoPlaying(false)
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-primary w-8" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
