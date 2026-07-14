'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  Plus,
  X,
  Loader2,
  BookOpen,
  Calendar,
  Tag,
  FileText,
  ChevronDown,
  Search,
} from 'lucide-react';
import { useCreateBookMutation, useGetFiltersQuery } from '@/features/books/api/bookApi';
import { useGetAuthorsQuery, useGetGenresQuery } from '@/features/admin/api/bookRelationApi';
import type { Author, Genre } from '@/features/books/types/book.interface';
import { useCreateBookForm, BookStatus } from '@/features/admin/hooks/books/useCreateBookForm';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const EMPTY_AUTHORS: Author[] = [];
const EMPTY_GENRES: Genre[] = [];

export default function CreateBook() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  const [authorSearch, setAuthorSearch] = useState('');
  const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);

  const [genreSearch, setGenreSearch] = useState('');
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAuthorDropdownOpen(false);
      }
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setIsGenreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [createBook] = useCreateBookMutation();
  const { data: authorsData = EMPTY_AUTHORS, isLoading: loadingAuthors } = useGetAuthorsQuery();
  const { data: genresData = EMPTY_GENRES, isLoading: loadingGenres } = useGetGenresQuery();
  const { data: filtersData } = useGetFiltersQuery();



  // Sort authors alphabetically
  const authors = [...authorsData].sort((a, b) => a.name.localeCompare(b.name));

  // Sort genres alphabetically
  const sortedGenres = [...genresData].sort((a, b) => a.name.localeCompare(b.name));

  const filteredAuthors = authorSearch
    ? authors.filter(author =>
      author.name.toLowerCase().includes(authorSearch.toLowerCase())
    )
    : authors;

  const filteredGenres = genreSearch
    ? sortedGenres.filter(genre =>
      genre.name.toLowerCase().includes(genreSearch.toLowerCase())
    )
    : sortedGenres;
  
  const {
    formData,
    coverPreview,
    selectedGenreId,
    setSelectedGenreId,
    message,
    isSubmitting,
    setFormData,
    handleImageUpload,
    handleAddGenre,
    handleRemoveGenre,
    handleReset,
    handleSubmit,
  } = useCreateBookForm((payload) => createBook(payload).unwrap());

  const getGenreName = (genreId: string) => {
    if (!genreId) return '';
    const genre = sortedGenres.find((g: Genre) => g.id === genreId);
    return genre?.name || genreId;
  };

  const getAuthorName = (authorId: string) => {
    if (authorId?.startsWith('new:')) {
      return authorId.replace('new:', '');
    }
    const author = authors.find((a: Author) => a.id === authorId);
    return author?.name || 'Chưa chọn';
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/books')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 mb-8 transition-colors uppercase tracking-widest px-0 hover:bg-transparent"
          >
            <ArrowLeft size={14} />
            Quay lại danh sách
          </Button>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Thêm sách mới
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              Điền đầy đủ thông tin để xuất bản sách trên hệ thống SocialBook
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-8 p-4 rounded-xl border shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
              }`}
          >
            <p className="font-semibold flex items-center gap-2">
              {message.type === 'success' ? '✓' : '✕'}
              {message.text}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-12">
                {/* Book Cover Section */}
                <div className="flex-none">
                  <div className="w-64 h-96 relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
                    <Image
                      src={coverPreview}
                      alt="Bìa sách"
                      fill
                      unoptimized
                      sizes="256px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="text-center text-white p-4">
                        <Upload size={32} className="mx-auto mb-3 animate-bounce" />
                        <p className="text-sm font-bold uppercase tracking-wider">Thay đổi ảnh bìa</p>
                      </div>
                    </div>
                  </div>

                  <label className="block mt-6 group">
                    <div className="flex flex-col items-center justify-center gap-3 py-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer group-hover:border-indigo-400 group-hover:bg-indigo-50/30 transition-all duration-300">
                      <div className="p-2 bg-slate-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                        <Upload size={24} className="text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest group-hover:text-indigo-700">Tải ảnh bìa lên</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Book Info Form */}
                <div className="flex-1 space-y-8">
                  {/* Title */}
                  <div className="space-y-2.5">
                    <Label htmlFor="title" className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      Tiêu đề sách *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Nhập tiêu đề sách đầy đủ..."
                      className="h-14 px-5 text-lg border-slate-200 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 rounded-xl"
                      required
                    />
                  </div>

                  {/* Author Dropdown and Published Year */}
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <Label className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        Tác giả *
                      </Label>
                      <div className="relative author-select-container" ref={dropdownRef}>
                        <div className="relative">
                          <Input
                            type="text"
                            value={authorSearch || (formData.authorId ? getAuthorName(formData.authorId) : '')}
                            onFocus={() => {
                              setIsAuthorDropdownOpen(true);
                            }}
                            onChange={(e) => {
                              setAuthorSearch(e.target.value);
                              setIsAuthorDropdownOpen(true);
                              if (formData.authorId && getAuthorName(formData.authorId) !== e.target.value) {
                                setFormData(prev => ({ ...prev, authorId: '', authorName: '' }));
                              }
                            }}
                            placeholder={loadingAuthors ? 'Đang tải...' : 'Chưa chọn'}
                            className="h-14 px-5 pr-12 border-slate-200 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 rounded-xl"
                            disabled={loadingAuthors}
                            required={!formData.authorId && !authorSearch}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                            {authorSearch && (
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={() => {
                                  setAuthorSearch('');
                                  setFormData(prev => ({ ...prev, authorId: '', authorName: '' }));
                                }}
                                className="h-8 w-8 hover:text-slate-600 rounded-full"
                              >
                                <X size={16} />
                              </Button>
                            )}
                            <ChevronDown size={20} className="pointer-events-none opacity-50" />
                          </div>
                        </div>

                        {isAuthorDropdownOpen && (
                          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-72 overflow-y-auto overflow-x-hidden p-2 animate-in fade-in zoom-in-95 duration-200">
                            {filteredAuthors.length > 0 ? (
                              <div className="grid gap-1">
                                {filteredAuthors.map((author: Author) => {
                                  const authorId = author.id;
                                  return (
                                    <button
                                      key={authorId}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, authorId, authorName: author.name }));
                                        setAuthorSearch(author.name);
                                        setIsAuthorDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-4 group ${formData.authorId === authorId ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                                        }`}
                                    >
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${formData.authorId === authorId ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                                        {author.name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="truncate">{author.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              authorSearch && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newAuthorName = authorSearch.trim();
                                    setFormData(prev => ({
                                      ...prev,
                                      authorId: `new:${newAuthorName}`,
                                      authorName: newAuthorName
                                    }));
                                    setIsAuthorDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-4 hover:bg-emerald-50 text-emerald-700 rounded-xl transition-all flex items-center gap-4 group border border-dashed border-emerald-200"
                                >
                                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                    <Plus size={20} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm">Thêm tác giả mới</p>
                                     <p className="text-xs opacity-70 italic">&ldquo;{authorSearch}&rdquo;</p>
                                  </div>
                                </button>
                              )
                            )}

                            {!authorSearch && filteredAuthors.length === 0 && !loadingAuthors && (
                              <div className="px-4 py-10 text-center text-slate-400">
                                <Search className="mx-auto mb-2 opacity-20" size={32} />
                                <p className="text-sm font-medium">Không tìm thấy tác giả nào</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="publishedYear" className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        Năm xuất bản
                      </Label>
                      <Input
                        id="publishedYear"
                        type="text"
                        value={formData.publishedYear}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            publishedYear: e.target.value,
                          }))
                        }
                        placeholder={new Date().getFullYear().toString()}
                        className="h-14 px-5 border-slate-200 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2.5">
                    <Label htmlFor="description" className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      Mô tả sách
                    </Label>
                    <Textarea
                      id="description"
                      rows={6}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Giới thiệu nội dung cốt truyện, bối cảnh và những điểm nổi bật..."
                      className="px-5 py-4 border-slate-200 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 rounded-2xl resize-none text-base leading-relaxed"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2.5">
                    <Label htmlFor="status" className="text-base font-bold text-slate-800">
                      Trạng thái phát hành
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: value as BookStatus,
                        }))
                      }
                    >
                      <SelectTrigger className="h-14 px-5 border-slate-200 focus:ring-indigo-500 focus:ring-offset-0 rounded-xl text-base">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100">
                        <SelectItem value="draft" className="py-3 cursor-pointer rounded-lg focus:bg-slate-50">Bản nháp</SelectItem>
                        <SelectItem value="published" className="py-3 cursor-pointer rounded-lg focus:bg-indigo-50">Đang xuất bản</SelectItem>
                        <SelectItem value="completed" className="py-3 cursor-pointer rounded-lg focus:bg-emerald-50">Hoàn thành</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Genres Section */}
            <div className="lg:col-span-2">
              <Card className="border-none shadow-sm h-full">
                <CardHeader className="border-b border-slate-50">
                  <CardTitle className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-indigo-500" />
                    Thể loại & Phân loại
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {/* Genre Dropdown */}
                  <div className="space-y-4">
                    <Label className="text-base font-bold text-slate-800">
                      Chọn thể loại sách *
                    </Label>
                    <div className="flex gap-4">
                      <div className="flex-1 relative" ref={genreDropdownRef}>
                        <div className="relative">
                          <Input
                            type="text"
                            value={genreSearch || getGenreName(selectedGenreId)}
                            onFocus={() => setIsGenreDropdownOpen(true)}
                            onChange={(e) => {
                              setGenreSearch(e.target.value);
                              setIsGenreDropdownOpen(true);
                              if (selectedGenreId) setSelectedGenreId('');
                            }}
                            placeholder={loadingGenres ? 'Đang tải...' : 'Tìm hoặc gõ thể loại mới...'}
                            className="h-14 px-5 pr-12 border-slate-200 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 rounded-xl"
                            disabled={loadingGenres}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                            {(genreSearch || selectedGenreId) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={() => {
                                  setGenreSearch('');
                                  setSelectedGenreId('');
                                }}
                                className="h-8 w-8 hover:text-slate-600 rounded-full"
                              >
                                <X size={16} />
                              </Button>
                            )}
                            <ChevronDown size={20} className="pointer-events-none opacity-50" />
                          </div>
                        </div>

                        {isGenreDropdownOpen && (
                          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-72 overflow-y-auto overflow-x-hidden p-2 animate-in fade-in zoom-in-95 duration-200">
                            {filteredGenres.length > 0 ? (
                              <div className="grid gap-1">
                                {filteredGenres.map((genre: Genre) => {
                                  const genreId = genre.id;
                                  const isAdded = formData.genres.includes(genreId);
                                  return (
                                    <button
                                      key={genreId}
                                      type="button"
                                      disabled={isAdded}
                                      onClick={() => {
                                        setSelectedGenreId(genreId);
                                        setGenreSearch(genre.name);
                                        setIsGenreDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-between group ${selectedGenreId === genreId ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                                        } ${isAdded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      <span className="truncate font-medium">{genre.name}</span>
                                      {isAdded && (
                                        <Badge variant="secondary" className="bg-slate-100 text-[10px] font-bold text-slate-400 border-none px-2 py-0.5">
                                          ĐÃ THÊM
                                        </Badge>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              genreSearch && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newGenreName = genreSearch.trim();
                                    setSelectedGenreId(`new:${newGenreName}`);
                                    setGenreSearch(newGenreName);
                                    setIsGenreDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-4 hover:bg-emerald-50 text-emerald-700 rounded-xl transition-all flex items-center gap-4 group border border-dashed border-emerald-200"
                                >
                                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                    <Plus size={20} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm">Thêm thể loại mới</p>
                                     <p className="text-xs opacity-70 italic">&ldquo;{genreSearch}&rdquo;</p>
                                  </div>
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          handleAddGenre();
                          setGenreSearch('');
                        }}
                        disabled={!selectedGenreId}
                        className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                      >
                        <Plus size={20} className="mr-2" />
                        Thêm
                      </Button>
                    </div>

                    {formData.genres.length > 0 && (
                      <div className="mt-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Thể loại đã chọn:</p>
                        <div className="flex flex-wrap gap-2.5">
                          {formData.genres.map((genreId) => (
                            <Badge
                              key={genreId}
                              className="pl-4 pr-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold border-none transition-colors group"
                            >
                              {getGenreName(genreId)}
                              <button
                                type="button"
                                onClick={() => handleRemoveGenre(genreId)}
                                className="ml-2 p-1 hover:bg-indigo-200 rounded-full text-indigo-400 hover:text-indigo-800 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags Input */}
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <Label htmlFor="tags" className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-500" />
                      Nhãn tìm kiếm (Tags)
                    </Label>
                    <Input
                      id="tags"
                      type="text"
                      value={formData.tagsInput}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tagsInput: e.target.value,
                        }))
                      }
                      placeholder="fantasy, hành động, cổ đại..."
                      className="h-14 px-5 border-slate-200 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 rounded-xl"
                    />

                    {filtersData?.tags && filtersData.tags.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Search size={12} />
                          Gợi ý phổ biến:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {filtersData.tags.slice(0, 12).map((tag) => (
                            <button
                              key={tag.name}
                              type="button"
                              onClick={() => {
                                const currentTags = formData.tagsInput.split(',').map(t => t.trim()).filter(Boolean);
                                if (!currentTags.includes(tag.name)) {
                                  const newValue = currentTags.length > 0
                                    ? `${formData.tagsInput.trim()}, ${tag.name}`
                                    : tag.name;
                                  setFormData(prev => ({ ...prev, tagsInput: newValue }));
                                }
                              }}
                              className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg transition-all border border-slate-100 font-bold"
                            >
                              #{tag.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-8">
              <Card className="border-none shadow-sm overflow-hidden bg-indigo-900 text-white">
                <CardHeader className="border-b border-indigo-800/50 pb-4">
                  <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Tóm tắt sách
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 text-sm font-medium">
                    <div className="flex justify-between items-start">
                      <span className="opacity-60">Tác giả:</span>
                      <span className="font-bold text-right ml-4 truncate max-w-[150px]">
                        {getAuthorName(formData.authorId)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Trạng thái:</span>
                      <span className="font-bold px-2 py-0.5 bg-white/10 rounded">
                        {formData.status === 'draft' && 'Bản nháp'}
                        {formData.status === 'published' && 'Đang xuất bản'}
                        {formData.status === 'completed' && 'Hoàn thành'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Thể loại:</span>
                      <span className="font-bold">
                        {formData.genres.length} thể loại
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Tags:</span>
                      <span className="font-bold">
                        {formData.tagsInput
                          ? formData.tagsInput.split(',').length
                          : 0}{' '}
                        nhãn
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-60">Năm:</span>
                      <span className="font-bold">
                        {formData.publishedYear || '—'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-extrabold text-lg shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={24} className="animate-spin mr-3" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <Plus size={24} className="mr-3" />
                            Tạo sách ngay
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 text-white border-none rounded-lg px-4 py-2">
                      <p>Sách sẽ được lưu vào hệ thống sau khi tạo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="w-full h-14 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all"
                >
                  Đặt lại toàn bộ form
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
