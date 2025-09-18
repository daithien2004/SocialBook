"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Menu, X, BookOpen, User, Bell, Settings, Heart, Library, PenTool, Crown } from "lucide-react"

export function Navigation() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const navItems = [
        { label: "Khám phá", href: "#", icon: BookOpen },
        { label: "Thư viện", href: "#", icon: Library },
        { label: "Yêu thích", href: "#", icon: Heart },
        { label: "Viết truyện", href: "#", icon: PenTool },
    ]

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/80 backdrop-blur-md shadow-lg border-b" : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                BookVerse
                            </h1>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </a>
                        ))}
                    </div>

                    {/* Search Bar (Desktop) */}
                    <div className="hidden lg:flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="pl-10 pr-4 py-2 w-64 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-full"
                            />
                        </div>
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <Button variant="ghost" size="icon" className="relative rounded-full">
                            <Bell className="w-5 h-5" />
                            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                                3
                            </Badge>
                        </Button>

                        {/* Premium Badge */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden sm:flex items-center gap-2 rounded-full border-yellow-400 text-yellow-600 hover:bg-yellow-50 bg-transparent"
                        >
                            <Crown className="w-4 h-4" />
                            Premium
                        </Button>

                        {/* User Menu */}
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <User className="w-5 h-5" />
                        </Button>

                        {/* Mobile Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden rounded-full"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t bg-background/95 backdrop-blur-md">
                        <div className="py-4 space-y-4">
                            {/* Mobile Search */}
                            <div className="px-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Tìm kiếm..."
                                        className="pl-10 pr-4 py-2 w-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-full"
                                    />
                                </div>
                            </div>

                            {/* Mobile Navigation Items */}
                            <div className="space-y-2 px-4">
                                {navItems.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <item.icon className="w-5 h-5 text-muted-foreground" />
                                        <span className="font-medium">{item.label}</span>
                                    </a>
                                ))}
                            </div>

                            {/* Mobile Actions */}
                            <div className="px-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <Button variant="outline" size="sm" className="flex items-center gap-2 rounded-full bg-transparent">
                                        <Crown className="w-4 h-4" />
                                        Nâng cấp Premium
                                    </Button>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <Settings className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
