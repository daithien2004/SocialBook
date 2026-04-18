'use client';

import { Hash, LogOut, MessageCircle, Plus, Search, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useChatSidebar } from './hooks';

interface ChatSidebarProps {
    currentUser: {
        id?: string;
        username?: string;
        name?: string;
        image?: string;
    } | null;
    users: string[];
    currentRoom: string | null;
    recipient: string | null;
    socketId: string | undefined;
    onSelectUser: (user: string) => void;
    onJoinRoom: (roomName: string) => void;
    onLeaveRoom: () => void;
}

export function ChatSidebar({
    currentUser,
    users,
    currentRoom,
    recipient,
    socketId,
    onSelectUser,
    onJoinRoom,
    onLeaveRoom,
}: ChatSidebarProps) {
    const {
        searchQuery,
        setSearchQuery,
        roomNameInput,
        setRoomNameInput,
        filteredUsers,
    } = useChatSidebar({ users, socketId });

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomNameInput) {
            onJoinRoom(roomNameInput);
            setRoomNameInput('');
        }
    };

    return (
        <Card className="w-80 flex flex-col border-none shadow-xl bg-white dark:bg-zinc-950">
            <CardHeader className="px-5 py-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                    SocialChat
                </CardTitle>
                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm bạn bè..."
                        className="pl-9 bg-gray-50 dark:bg-zinc-900 border-none h-10 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </CardHeader>

            <Tabs defaultValue="users" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-5 bg-gray-100 dark:bg-zinc-900 rounded-xl p-1">
                    <TabsTrigger
                        value="users"
                        className="flex-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 shadow-none"
                    >
                        Bạn bè
                    </TabsTrigger>
                    <TabsTrigger
                        value="rooms"
                        className="flex-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 shadow-none"
                    >
                        Phòng
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="flex-1 overflow-hidden m-0">
                    <UserList
                        users={filteredUsers}
                        currentUserId={currentUser?.id}
                        selectedUser={recipient}
                        onSelectUser={onSelectUser}
                    />
                </TabsContent>

                <TabsContent value="rooms" className="flex-1 overflow-hidden m-0 flex flex-col">
                    <RoomList
                        currentRoom={currentRoom}
                        users={users}
                        socketId={socketId}
                        roomNameInput={roomNameInput}
                        onRoomNameChange={setRoomNameInput}
                        onJoinRoom={handleJoinRoom}
                        onLeaveRoom={onLeaveRoom}
                    />
                </TabsContent>
            </Tabs>

            <CardFooter className="p-4 border-t dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/20">
                <div className="flex items-center gap-3 w-full">
                    <Avatar className="w-8 h-8 rounded-lg">
                        <AvatarFallback className="text-[10px]">{currentUser?.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-bold truncate">{currentUser?.name || 'Vãng khách'}</span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-500/30 text-emerald-600 w-fit">
                            Online
                        </Badge>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}

interface UserListProps {
    users: string[];
    currentUserId?: string;
    selectedUser: string | null;
    onSelectUser: (user: string) => void;
}

function UserList({ users, currentUserId, selectedUser, onSelectUser }: UserListProps) {
    return (
        <div className="h-full px-3 overflow-y-auto">
            <div className="space-y-1 py-4">
                {users.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm italic">
                        Không tìm thấy ai...
                    </div>
                ) : (
                    users.map((user) => (
                        <Button
                            key={user}
                            variant="ghost"
                            className={`w-full justify-start gap-3 h-14 rounded-xl px-3 transition-all ${
                                selectedUser === user
                                    ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600'
                                    : 'hover:bg-gray-100 dark:hover:bg-zinc-900'
                            }`}
                            onClick={() => onSelectUser(user)}
                        >
                            <UserAvatar
                                name={user}
                                size="md"
                                showOnlineStatus
                                isOnline
                            />
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="font-semibold text-sm truncate w-full">
                                    {user === currentUserId ? 'Tôi (Bạn)' : user}
                                </span>
                                <span className="text-[10px] text-muted-foreground opacity-70">
                                    Đang hoạt động
                                </span>
                            </div>
                        </Button>
                    ))
                )}
            </div>
        </div>
    );
}

interface RoomListProps {
    currentRoom: string | null;
    users: string[];
    socketId: string | undefined;
    roomNameInput: string;
    onRoomNameChange: (value: string) => void;
    onJoinRoom: (e: React.FormEvent) => void;
    onLeaveRoom: () => void;
}

function RoomList({
    currentRoom,
    users,
    socketId,
    roomNameInput,
    onRoomNameChange,
    onJoinRoom,
    onLeaveRoom,
}: RoomListProps) {
    return (
        <>
            <div className="p-4 border-b dark:border-zinc-800">
                <form onSubmit={onJoinRoom} className="flex gap-2">
                    <Input
                        value={roomNameInput}
                        onChange={(e) => onRoomNameChange(e.target.value)}
                        placeholder="Tên phòng..."
                        className="bg-gray-50 dark:bg-zinc-900 border-none h-10 rounded-xl"
                        disabled={!!currentRoom}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700"
                        disabled={!!currentRoom || !roomNameInput}
                    >
                        <Plus className="w-5 h-5" />
                    </Button>
                </form>
            </div>
            <div className="flex-1 px-3 overflow-y-auto">
                <div className="space-y-1 py-4">
                    {currentRoom ? (
                        <div className="p-2 space-y-2">
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                                    <Hash className="w-4 h-4" />
                                    {currentRoom}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg"
                                    onClick={onLeaveRoom}
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="text-[10px] uppercase font-bold text-muted-foreground px-1 tracking-wider">
                                Thành viên khác
                            </div>
                            {users
                                .filter((u) => u !== socketId)
                                .map((u) => (
                                    <div
                                        key={u}
                                        className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground italic"
                                    >
                                        <User className="w-3 h-3" /> {u}
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground text-sm italic">
                            Nhập tên để tham gia phòng
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
