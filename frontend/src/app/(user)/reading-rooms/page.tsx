'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useGetBooksQuery } from '@/features/books/api/bookApi';
import { useCreateRoomMutation, useGetMyActiveRoomsQuery } from '@/features/reading-rooms/api/readingRoomsApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ReadingRoomsHub() {
  const [roomCode, setRoomCode] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [createRoom, { isLoading }] = useCreateRoomMutation();
  const { data: booksData, isLoading: isBooksLoading } = useGetBooksQuery({ page: 1, limit: 10 });
  const { data: myRooms, isLoading: isMyRoomsLoading } = useGetMyActiveRoomsQuery();
  const router = useRouter();

  const handleCreate = async () => {
    if (!selectedBook) {
      toast.error('Vui lòng chọn một cuốn sách để đọc chung');
      return;
    }

    try {
      const res = await createRoom({
        bookId: selectedBook,
        currentChapterSlug: 'chuong-1',
        mode: 'sync',
        maxMembers: 10
      }).unwrap();
      toast.success('Tạo phòng thành công!');
      router.push(`/reading-rooms/${res.roomId}`);
    } catch (e: any) {
      toast.error('Không thể tạo phòng đọc');
    }
  };

  const handleJoin = () => {
    if (!roomCode) {
      toast.error('Vui lòng nhập mã phòng');
      return;
    }
    router.push(`/reading-rooms/${roomCode.toUpperCase()}`);
  }

  return (
    <div className="container max-w-4xl py-10 mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Phòng Đọc Sách Cùng Nhau</h1>
        <p className="text-muted-foreground text-lg">Đọc sách, đồng bộ trang và thảo luận trực tiếp cùng bạn bè.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full">
         <div className="flex flex-col border p-8 rounded-2xl bg-card shadow-sm h-full">
           <h2 className="text-2xl font-semibold mb-2">Tham gia phòng</h2>
           <p className="text-muted-foreground mb-6">Nhập mã phòng do bạn bè chia sẻ để tham gia đọc chung.</p>
           <div className="flex flex-col gap-2 mt-auto">
             <Input
               placeholder="Mã phòng (VD: X8A9F2)"
               value={roomCode}
               onChange={e => setRoomCode(e.target.value)}
               className="text-lg uppercase"
               maxLength={6}
             />
             <Button size="lg" onClick={handleJoin}>Vào phòng</Button>
           </div>
         </div>

         <div className="flex flex-col border p-8 rounded-2xl bg-card shadow-sm border-primary/20 h-full">
           <h2 className="text-2xl font-semibold mb-2 text-primary">Tạo phòng mới</h2>
           <p className="text-muted-foreground mb-6">Trở thành trưởng phòng, mời bạn bè và làm chủ phiên đọc sách.</p>

           <div className="mb-6">
             <label className="text-sm font-medium mb-2 block">Chọn sách để đọc</label>
             <Select value={selectedBook} onValueChange={setSelectedBook} disabled={isBooksLoading}>
               <SelectTrigger>
                 <SelectValue placeholder={isBooksLoading ? "Đang tải danh sách..." : "Chọn một cuốn sách"} />
               </SelectTrigger>
               <SelectContent>
                 {booksData?.data.map((book) => (
                   <SelectItem key={book.id} value={book.id}>
                     {book.title}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>

           <Button size="lg" onClick={handleCreate} disabled={isLoading || !selectedBook} className="mt-auto w-full">
             {isLoading ? 'Đang tạo...' : 'Tạo phòng ngay'}
           </Button>
         </div>
       </div>

      {/* My Active Rooms Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          Phòng của bạn đang tham gia
        </h2>

        {isMyRoomsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : myRooms && myRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRooms.map((room) => {
              // Find book title from booksData if available
              const book = booksData?.data.find(b => b.id === room.bookId);

              return (
                <div
                  key={room.roomId}
                  className="group p-4 border rounded-2xl bg-card hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => router.push(`/reading-rooms/${room.roomId}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black tracking-widest text-primary uppercase bg-primary/10 px-2 py-1 rounded-md">
                      {room.roomId}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {room.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {book?.title || 'Đang đọc chung...'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Đang ở: {room.currentChapterSlug}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-3xl opacity-50">
            <p className="text-muted-foreground">Bạn chưa tham gia phòng nào.</p>
          </div>
        )}
      </div>
    </div>
  )
}
