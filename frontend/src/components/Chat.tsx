'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import debounce from 'lodash.debounce';
import {
    Send,
    Hash,
    User,
    LogOut,
    Phone,
    Video,
    Info,
    MoreVertical,
    Check,
    CheckCheck,
    Search,
    Plus,
    MessageCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useAppAuth } from '@/hooks/useAppAuth';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL + '/chat';

interface Message {
    user: string;
    text: string;
    room?: string;
    private?: boolean;
    messageId: string;
    deliveredTo: string[];
    readBy: string[];
    timestamp?: number;
}

export default function Chat() {
    const { user: currentUser } = useAppAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [roomNameInput, setRoomNameInput] = useState('');
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [recipient, setRecipient] = useState<string | null>(null);
    const [users, setUsers] = useState<string[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Socket Connection
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            auth: { token: 'your-jwt-token' }, // In production, this should be real token
            reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => console.log('Connected to socket'));
        newSocket.on('message', (msg: Message) => {
            const enrichedMsg = {
                ...msg,
                readBy: msg.readBy || [],
                deliveredTo: msg.deliveredTo || [],
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, enrichedMsg]);

            if (msg.room) {
                newSocket.emit('deliveryReceipt', { messageId: msg.messageId, room: msg.room });
            } else if (msg.private) {
                newSocket.emit('deliveryReceipt', { messageId: msg.messageId, to: msg.user });
            }
        });

        newSocket.on('userList', (userList: string[]) => setUsers(userList));
        newSocket.on('typing', ({ user, isTyping }) => {
            setTypingUsers((prev) =>
                isTyping ? [...new Set([...prev, user])] : prev.filter((u) => u !== user)
            );
        });

        newSocket.on('deliveryReceipt', ({ messageId, deliveredTo }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.messageId === messageId
                        ? { ...msg, deliveredTo: [...new Set([...(msg.deliveredTo || []), deliveredTo])] }
                        : msg
                )
            );
        });

        newSocket.on('readReceipt', ({ messageId, readBy }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.messageId === messageId
                        ? { ...msg, readBy: [...new Set([...(msg.readBy || []), readBy])] }
                        : msg
                )
            );
        });

        setSocket(newSocket);
        return () => { newSocket.disconnect(); };
    }, []);

    // Intersection Observer for Read Receipts
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && socket) {
                        const messageId = entry.target.getAttribute('data-message-id');
                        if (messageId) {
                            // Find message to check if it's already read by us
                            const msg = messages.find(m => m.messageId === messageId);
                            if (msg && msg.user !== socket.id && !msg.readBy.includes(socket.id || '')) {
                                socket.emit('readMessage', {
                                    messageId,
                                    room: currentRoom || undefined,
                                    to: recipient || undefined,
                                });
                            }
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        messageRefs.current.forEach((ref) => observer.observe(ref));
        return () => messageRefs.current.forEach((ref) => observer.unobserve(ref));
    }, [messages, socket, currentRoom, recipient]);

    // Typing logic
    const sendTyping = useCallback(
        debounce((isTyping: boolean) => {
            if (socket && (currentRoom || recipient)) {
                socket.emit('typing', {
                    room: currentRoom || undefined,
                    to: recipient || undefined,
                    isTyping,
                });
            }
        }, 500),
        [socket, currentRoom, recipient]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        sendTyping(!!e.target.value);
    };

    const joinRoom = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (socket && roomNameInput && !currentRoom) {
            socket.emit('joinRoom', roomNameInput);
            setCurrentRoom(roomNameInput);
            setRecipient(null);
            setMessages([]);
            setTypingUsers([]);
            setRoomNameInput('');
        }
    };

    const leaveRoom = () => {
        if (socket && currentRoom) {
            socket.emit('leaveRoom', currentRoom);
            setCurrentRoom(null);
            setMessages([]);
            setTypingUsers([]);
        }
    };

    const sendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (socket && input.trim()) {
            const payload = currentRoom ? { room: currentRoom, text: input } : { to: recipient, text: input };
            socket.emit('message', payload);
            setInput('');
            sendTyping(false);
        }
    };

    const filteredUsers = users.filter(u => u.toLowerCase().includes(searchQuery.toLowerCase()) && u !== socket?.id);

    return (
        <div className="flex h-[calc(100vh-120px)] max-w-6xl mx-auto gap-4 p-4 animate-in fade-in duration-500">
            {/* Sidebar: Users & Rooms */}
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
                        <TabsTrigger value="users" className="flex-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 shadow-none">Bạn bè</TabsTrigger>
                        <TabsTrigger value="rooms" className="flex-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 shadow-none">Phòng</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="flex-1 overflow-hidden m-0">
                        <ScrollArea className="h-full px-3">
                            <div className="space-y-1 py-4">
                                {filteredUsers.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground text-sm italic">
                                        Không tìm thấy ai...
                                    </div>
                                ) : filteredUsers.map((user) => (
                                    <Button
                                        key={user}
                                        variant="ghost"
                                        className={`w-full justify-start gap-3 h-14 rounded-xl px-3 transition-all ${recipient === user ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-zinc-900'}`}
                                        onClick={() => { setRecipient(user); setCurrentRoom(null); setMessages([]); }}
                                    >
                                        <div className="relative">
                                            <Avatar className="w-10 h-10 border-2 border-background">
                                                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{user[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full" />
                                        </div>
                                        <div className="flex flex-col items-start overflow-hidden">
                                            <span className="font-semibold text-sm truncate w-full">{user === currentUser?.id ? 'Tôi (Bạn)' : user}</span>
                                            <span className="text-[10px] text-muted-foreground opacity-70">Đang hoạt động</span>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="rooms" className="flex-1 overflow-hidden m-0 flex flex-col">
                        <div className="p-4 border-b dark:border-zinc-800">
                            <form onSubmit={joinRoom} className="flex gap-2">
                                <Input
                                    value={roomNameInput}
                                    onChange={(e) => setRoomNameInput(e.target.value)}
                                    placeholder="Tên phòng..."
                                    className="bg-gray-50 dark:bg-zinc-900 border-none h-10 rounded-xl"
                                    disabled={!!currentRoom}
                                />
                                <Button type="submit" size="icon" className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700" disabled={!!currentRoom || !roomNameInput}>
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </form>
                        </div>
                        <ScrollArea className="flex-1 px-3">
                            <div className="space-y-1 py-4">
                                {currentRoom && (
                                    <div className="p-2 space-y-2">
                                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                                                <Hash className="w-4 h-4" />
                                                {currentRoom}
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg" onClick={leaveRoom}>
                                                <LogOut className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground px-1 tracking-wider">Thành viên khác</div>
                                        {users.filter(u => u !== socket?.id).map((u) => (
                                            <div key={u} className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground italic">
                                                <User className="w-3 h-3" /> {u}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!currentRoom && (
                                    <div className="text-center py-10 text-muted-foreground text-sm italic">
                                        Nhập tên để tham gia phòng
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                <CardFooter className="p-4 border-t dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/20">
                    <div className="flex items-center gap-3 w-full">
                        <Avatar className="w-8 h-8 rounded-lg">
                            <AvatarImage src={currentUser?.image} />
                            <AvatarFallback className="text-[10px]">{currentUser?.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold truncate">{currentUser?.name || 'Vãng khách'}</span>
                            <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-500/30 text-emerald-600 w-fit">Online</Badge>
                        </div>
                    </div>
                </CardFooter>
            </Card>

            {/* Main Chat Area */}
            <Card className="flex-1 flex flex-col border-none shadow-2xl overflow-hidden bg-white dark:bg-zinc-950">
                {!currentRoom && !recipient ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50/30 dark:bg-zinc-900/10">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <MessageCircle className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold dark:text-white">Bắt đầu cuộc trò chuyện</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs">Chọn một người bạn hoặc tham gia phòng để cùng thảo luận về sách.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <CardHeader className="px-6 py-4 border-b dark:border-zinc-800 flex flex-row items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="w-10 h-10 border-2 border-blue-50 dark:border-blue-900/20">
                                        <AvatarFallback className="bg-blue-600 text-white font-bold">
                                            {(currentRoom || recipient || '?')[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {!currentRoom ? <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full" /> : null}
                                </div>
                                <div>
                                    <div className="font-bold flex items-center gap-1.5">
                                        {currentRoom ? <><Hash className="w-4 h-4 text-muted-foreground" /> {currentRoom}</> : recipient}
                                        {currentRoom ? <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] h-4">Phòng Chat</Badge> : null}
                                    </div>
                                    <div className="flex items-center gap-1.5 h-4">
                                        {typingUsers.length > 0 ? (
                                            <span className="text-[11px] text-blue-600 font-medium animate-pulse">
                                                {typingUsers.join(', ')} đang soạn tin...
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                                                <span className="relative flex h-1.5 w-1.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                                </span>
                                                Trực tuyến
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:bg-gray-100">
                                    <Phone className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:bg-gray-100">
                                    <Video className="w-4 h-4" />
                                </Button>
                                <Separator orientation="vertical" className="h-6 mx-1" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:bg-gray-100">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-lg border-zinc-200">
                                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium"><Info className="w-4 h-4" /> Thông tin cuộc gọi</DropdownMenuItem>
                                        {currentRoom ? <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium text-red-600" onClick={leaveRoom}><LogOut className="w-4 h-4" /> Rời khỏi phòng</DropdownMenuItem> : null}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>

                        {/* Message List */}
                        <ScrollArea className="flex-1 bg-slate-50/20 dark:bg-zinc-900/10">
                            <div className="px-6 py-8 space-y-6">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                        <MessageCircle className="w-12 h-12 mb-3 text-muted-foreground" />
                                        <p className="text-sm font-medium">Chưa có tin nhắn nào.<br />Hãy bắt đầu câu chuyện!</p>
                                    </div>
                                ) : null}
                                {messages.map((msg, idx) => {
                                    const isMe = msg.user === socket?.id;
                                    return (
                                        <div
                                            key={`${msg.messageId}-${idx}`}
                                            className={`flex w-full group animate-in flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                        >
                                            <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className="flex-none pt-1">
                                                    <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-zinc-900">
                                                        <AvatarFallback className={isMe ? 'bg-blue-600 text-white' : 'bg-gray-200'}>
                                                            {msg.user[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    {!isMe && !currentRoom ? <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-1">{msg.user}</span> : null}
                                                    {currentRoom && !isMe ? <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-1">{msg.user}</span> : null}
                                                    <div
                                                        data-message-id={msg.messageId}
                                                        ref={(el) => { if (el) messageRefs.current.set(msg.messageId, el); else messageRefs.current.delete(msg.messageId); }}
                                                        className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all ${isMe
                                                                ? 'bg-blue-600 text-white rounded-tr-none hover:bg-blue-700'
                                                                : 'bg-white dark:bg-zinc-800 text-foreground rounded-tl-none border dark:border-zinc-700 hover:border-blue-200'
                                                            }`}
                                                    >
                                                        {msg.text}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1 px-1">
                                                        <span className="text-[9px] text-muted-foreground font-medium opacity-60">
                                                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM'}
                                                        </span>
                                                        {isMe && (
                                                            <div className="flex text-blue-500 opacity-80">
                                                                {msg.readBy.length > 1 ? (
                                                                    <CheckCheck className="w-3 h-3" />
                                                                ) : (
                                                                    <Check className="w-3 h-3" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        {/* Chat Input */}
                        <CardFooter className="p-4 bg-white dark:bg-zinc-950 border-t dark:border-zinc-800">
                            <form onSubmit={sendMessage} className="flex items-center gap-3 w-full bg-gray-50 dark:bg-zinc-900 p-2 rounded-2xl border border-transparent focus-within:border-blue-500/30 focus-within:bg-white dark:focus-within:bg-zinc-800 transition-all">
                                <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700">
                                    <Plus className="w-5 h-5" />
                                </Button>
                                <Input
                                    placeholder="Nhập tin nhắn của bạn..."
                                    className="border-none bg-transparent h-10 px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium"
                                    value={input}
                                    onChange={handleInputChange}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className={`h-10 w-10 rounded-xl transition-all ${input.trim() ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg active:scale-95' : 'bg-transparent text-muted-foreground'}`}
                                    disabled={!input.trim()}
                                >
                                    {input.trim() ? <Send className="w-5 h-5" /> : <Send className="w-5 h-5 text-muted-foreground" />}
                                </Button>
                            </form>
                        </CardFooter>
                    </>
                )}
            </Card>
        </div>
    );
}
