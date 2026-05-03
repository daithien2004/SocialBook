'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';
import { useAppAuth } from '@/features/auth/hooks';
import { useChatSocket } from '@/features/chat/hooks/useChatSocket';
import { ChatSidebar } from './ChatSidebar';
import { ChatMainArea } from './ChatMainArea';
import type { Message } from '@/features/chat/types';

export default function Chat() {
    const { user: currentUser } = useAppAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [recipient, setRecipient] = useState<string | null>(null);
    const [users, setUsers] = useState<string[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    const handleMessage = useCallback((msg: Message) => {
        setMessages((prev) => [...prev, msg]);
    }, []);

    const handleUserList = useCallback((userList: string[]) => {
        setUsers(userList);
    }, []);

    const handleTyping = useCallback(({ user, isTyping }: { user: string; isTyping: boolean }) => {
        setTypingUsers((prev) =>
            isTyping ? [...new Set([...prev, user])] : prev.filter((u) => u !== user)
        );
    }, []);

    const handleDeliveryReceipt = useCallback(({ messageId, deliveredTo }: { messageId: string; deliveredTo: string[] }) => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg.messageId === messageId
                    ? { ...msg, deliveredTo: [...new Set([...(msg.deliveredTo || []), ...deliveredTo])] }
                    : msg
            )
        );
    }, []);

    const handleReadReceipt = useCallback(({ messageId, readBy }: { messageId: string; readBy: string }) => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg.messageId === messageId
                    ? { ...msg, readBy: [...new Set([...(msg.readBy || []), readBy])] }
                    : msg
            )
        );
    }, []);

    const { socket } = useChatSocket({
        onMessage: handleMessage,
        onUserList: handleUserList,
        onTyping: handleTyping,
        onDeliveryReceipt: handleDeliveryReceipt,
        onReadReceipt: handleReadReceipt,
    });

    const sendMessage = useCallback(
        (e?: React.FormEvent) => {
            e?.preventDefault();
            if (socket && input.trim()) {
                const payload = currentRoom
                    ? { room: currentRoom, text: input }
                    : { to: recipient, text: input };
                socket.emit('message', payload);
                setInput('');
                sendTyping(false);
            }
        },
        [socket, input, currentRoom, recipient]
    );

    const sendTyping = useCallback(
        (isTyping: boolean) => {
            if (socket && (currentRoom || recipient)) {
                socket.emit('typing', {
                    room: currentRoom || undefined,
                    to: recipient || undefined,
                    isTyping,
                });
            }
        },
        [socket, currentRoom, recipient]
    );

    const debouncedTyping = useMemo(
        () =>
            debounce((isTyping: boolean) => {
                sendTyping(isTyping);
            }, 500),
        [sendTyping]
    );

    const handleInputChange = useCallback((value: string) => {
        setInput(value);
        debouncedTyping(!!value);
    }, [debouncedTyping]);

    const handleMessageVisible = useCallback(
        (messageId: string) => {
            const msg = messages.find((m) => m.messageId === messageId);
            if (msg && msg.user !== socket?.id && !msg.readBy.includes(socket?.id || '')) {
                socket?.emit('readMessage', {
                    messageId,
                    room: currentRoom || undefined,
                    to: recipient || undefined,
                });
            }
        },
        [messages, socket, currentRoom, recipient]
    );

    const selectUser = useCallback((user: string) => {
        setRecipient(user);
        setCurrentRoom(null);
        setMessages([]);
    }, []);

    const joinRoom = useCallback((roomName: string) => {
        if (socket && roomName) {
            socket.emit('joinRoom', roomName);
            setCurrentRoom(roomName);
            setRecipient(null);
            setMessages([]);
            setTypingUsers([]);
        }
    }, [socket]);

    const leaveRoom = useCallback(() => {
        if (socket && currentRoom) {
            socket.emit('leaveRoom', currentRoom);
            setCurrentRoom(null);
            setMessages([]);
            setTypingUsers([]);
        }
    }, [socket, currentRoom]);

    return (
        <div className="flex h-[calc(100vh-120px)] max-w-6xl mx-auto gap-4 p-4 animate-in fade-in duration-500">
            <ChatSidebar
                currentUser={currentUser}
                users={users}
                currentRoom={currentRoom}
                recipient={recipient}
                socketId={socket?.id}
                onSelectUser={selectUser}
                onJoinRoom={joinRoom}
                onLeaveRoom={leaveRoom}
            />
            <ChatMainArea
                currentRoom={currentRoom}
                recipient={recipient}
                typingUsers={typingUsers}
                messages={messages}
                socketId={socket?.id || null}
                input={input}
                currentUser={currentUser}
                onLeaveRoom={leaveRoom}
                onInputChange={handleInputChange}
                onSendMessage={sendMessage}
                onMessageVisible={handleMessageVisible}
            />
        </div>
    );
}
