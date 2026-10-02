import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, BookOpen, Users, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookSummaryPage, BookSummary } from '@/features/books/schemas/book.schema';

export function CreateRoomTab({
  selectedBook,
  setSelectedBook,
  openSearchBook,
  setOpenSearchBook,
  maxMembers,
  setMaxMembers,
  handleCreate,
  isLoading,
  isBooksLoading,
  booksData,
  hasNoChapters,
  selectedBookData
}: {
  selectedBook: string;
  setSelectedBook: (val: string) => void;
  openSearchBook: boolean;
  setOpenSearchBook: (val: boolean) => void;
  maxMembers: number;
  setMaxMembers: (val: number) => void;
  handleCreate: () => void;
  isLoading: boolean;
  isBooksLoading: boolean;
  booksData?: BookSummaryPage;
  hasNoChapters: boolean;
  selectedBookData?: BookSummary;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="grid lg:grid-cols-2">
        {/* Cột trái: Form */}
        <div className="p-6 md:p-8 space-y-8 bg-card">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <Plus className="w-6 h-6 text-primary" />
              Tạo phòng đọc mới
            </h2>
            <p className="text-muted-foreground text-sm">
              Lựa chọn sách và số lượng người tham gia để bắt đầu hành trình đọc sách cùng bạn bè.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                Chọn sách
              </label>
              <Popover open={openSearchBook} onOpenChange={setOpenSearchBook}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSearchBook}
                    disabled={isBooksLoading}
                    className="w-full justify-between h-12 bg-muted/30 font-normal"
                  >
                    {isBooksLoading ? (
                      <span className="text-muted-foreground">Đang tải...</span>
                    ) : selectedBook ? (
                      <span className="truncate pr-4">
                        {booksData?.data.find((b: BookSummary) => b.id === selectedBook)?.title}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Tìm sách bạn muốn đọc chung...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Tìm tên sách..." className="h-11" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>Không tìm thấy sách nào.</CommandEmpty>
                      <CommandGroup>
                        {booksData?.data.map((book: BookSummary) => {
                          const noChapters = !book.stats?.chapterCount || book.stats.chapterCount === 0;
                          return (
                            <CommandItem
                              key={book.id}
                              value={`${book.id} ${book.title}`}
                              disabled={noChapters}
                              onSelect={(currentValue) => {
                                // commanditem value is lowercased string. We use ID for state
                                setSelectedBook(currentValue === selectedBook ? "" : book.id);
                                setOpenSearchBook(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  selectedBook === book.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate pr-2">{book.title}</span>
                              {noChapters && (
                                <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1 text-muted-foreground shrink-0">
                                  Chưa có chương
                                </Badge>
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Số người tham gia tối đa
                </label>
                <div className="bg-primary text-primary-foreground font-bold px-3 py-1 rounded-full text-sm shadow-sm">
                  {maxMembers} người
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {[2, 5, 10, 20].map((num) => (
                  <Button
                    key={num}
                    variant={maxMembers === num ? "default" : "outline"}
                    size="sm"
                    className="rounded-full flex-1 h-8 text-xs font-medium"
                    onClick={() => setMaxMembers(num)}
                  >
                    {num} người
                  </Button>
                ))}
              </div>

              <div className="pt-2 px-2">
                <Slider
                  min={2}
                  max={20}
                  step={1}
                  value={[maxMembers]}
                  onValueChange={([v]) => setMaxMembers(v)}
                  className="w-full cursor-pointer [&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-wider">
                  <span>Ít người (2)</span>
                  <span>Đông đúc (20)</span>
                </div>
              </div>

              <div className="mt-3 bg-info/10 text-info p-2.5 rounded-lg text-xs flex items-start gap-2">
                <span className="text-[10px] mt-0.5">💡</span>
                <p>
                  <strong>Mẹo:</strong> Phòng từ 5-10 người thường mang lại trải nghiệm đọc và thảo luận tập trung nhất!
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              size="lg"
              className="w-full h-12 text-base font-bold shadow-md hover:shadow-lg transition-all"
              onClick={handleCreate}
              disabled={isLoading || !selectedBook || hasNoChapters}
            >
              {isLoading ? 'Đang tạo phòng...' : hasNoChapters ? 'Sách chưa có chương' : (
                <>
                  <Users className="w-5 h-5 mr-2" />
                  Mở Phòng Ngay
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Cột phải: Live Preview */}
        <div className="bg-muted/30 p-6 md:p-8 flex items-center justify-center border-l border-border/50">
          {selectedBookData ? (
            <div className="w-full max-w-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
                Phòng đọc của bạn sẽ có diện mạo
              </p>
              <Card className="overflow-hidden shadow-xl border-border/60 bg-background/50 backdrop-blur-sm group">
                <div className="aspect-[3/4] relative w-full bg-muted">
                  {selectedBookData.coverUrl ? (
                    <Image
                      src={selectedBookData.coverUrl}
                      alt={selectedBookData.title || ''}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 384px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <Badge className="bg-destructive/90 hover:bg-destructive text-destructive-foreground border-0 mb-3 backdrop-blur-md">
                      Live
                    </Badge>
                    <h3 className="text-2xl font-bold mb-2 line-clamp-2 drop-shadow-md">
                      {selectedBookData.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                      <span className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md backdrop-blur-md">
                        <Users className="w-4 h-4" />
                        1 / {maxMembers}
                      </span>
                      <span className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md backdrop-blur-md">
                        <BookOpen className="w-4 h-4" />
                        {selectedBookData.stats?.chapterCount || 0} chương
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="w-full max-w-sm text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6 shadow-inner">
                <BookOpen className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold mb-2">Chưa chọn sách</h3>
              <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                Bảng xem trước sẽ hiển thị ở đây sau khi bạn chọn một cuốn sách.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
