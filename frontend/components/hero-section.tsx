"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, BookOpen, Users, Star, TrendingUp, Sparkles } from "lucide-react"

export function HeroSection() {
    const [searchQuery, setSearchQuery] = useState("")
    const [currentSlogan, setCurrentSlogan] = useState(0)

    const slogans = [
        "Khám phá thế giới không giới hạn",
        "Hàng triệu câu chuyện đang chờ bạn",
        "Nơi những giấc mơ trở thành hiện thực",
        "Đọc sách - Sống trọn vẹn",
    ]

    const stats = [
        { icon: BookOpen, label: "Truyện", value: "50K+", color: "text-blue-500" },
        { icon: Users, label: "Độc giả", value: "2M+", color: "text-green-500" },
        { icon: Star, label: "Đánh giá", value: "4.8", color: "text-yellow-500" },
        { icon: TrendingUp, label: "Tác giả", value: "10K+", color: "text-purple-500" },
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlogan((prev) => (prev + 1) % slogans.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <div className="absolute inset-0 bg-[url('/abstract-book-pattern.png')] opacity-5 bg-cover bg-center" />

                {/* Floating elements */}
                <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full animate-float" />
                <div
                    className="absolute top-40 right-32 w-24 h-24 bg-secondary/10 rounded-full animate-float"
                    style={{ animationDelay: "1s" }}
                />
                <div
                    className="absolute bottom-32 left-1/4 w-20 h-20 bg-accent/10 rounded-full animate-float"
                    style={{ animationDelay: "2s" }}
                />
                <div
                    className="absolute bottom-20 right-20 w-28 h-28 bg-primary/10 rounded-full animate-float"
                    style={{ animationDelay: "0.5s" }}
                />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
                {/* Main content */}
                <div className="mb-8">
                    <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Nền tảng đọc sách hàng đầu Việt Nam
                    </Badge>

                    <h1 className="text-6xl md:text-7xl font-bold mb-6 text-balance">
                        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            BookVerse
                        </span>
                    </h1>

                    <div className="h-16 flex items-center justify-center mb-8">
                        <p className="text-xl md:text-2xl text-muted-foreground animate-fade-in-up text-balance">
                            {slogans[currentSlogan]}
                        </p>
                    </div>
                </div>

                {/* Search bar */}
                <div className="max-w-2xl mx-auto mb-12">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                        <div className="relative flex items-center bg-card/80 backdrop-blur-sm rounded-full border shadow-lg hover:shadow-xl transition-all duration-300">
                            <Input
                                type="text"
                                placeholder="Tìm kiếm truyện, tác giả, thể loại..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 border-0 bg-transparent text-lg px-6 py-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            <Button
                                size="lg"
                                className="rounded-full mr-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                            >
                                <Search className="w-5 h-5 mr-2" />
                                Tìm kiếm
                            </Button>
                        </div>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                    <Button
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                        <BookOpen className="w-5 h-5 mr-2" />
                        Bắt đầu đọc
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="px-8 py-4 text-lg rounded-full border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:-translate-y-1 bg-transparent"
                    >
                        <Users className="w-5 h-5 mr-2" />
                        Tham gia cộng đồng
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className="group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border hover:bg-card/80 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div
                                className={`inline-flex p-3 rounded-full bg-background/50 mb-4 group-hover:scale-110 transition-transform duration-300 ${stat.color}`}
                            >
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="text-3xl font-bold mb-2">{stat.value}</div>
                            <div className="text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
