'use client';

import { useState, useCallback } from 'react';

interface UseChatSidebarOptions {
    users: string[];
    socketId?: string;
}

export function useChatSidebar({ users, socketId }: UseChatSidebarOptions) {
    const [searchQuery, setSearchQuery] = useState('');
    const [roomNameInput, setRoomNameInput] = useState('');

    const filteredUsers = users.filter(
        (u) => u.toLowerCase().includes(searchQuery.toLowerCase()) && u !== socketId
    );

    const handleRoomNameChange = useCallback((value: string) => {
        setRoomNameInput(value);
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        roomNameInput,
        setRoomNameInput: handleRoomNameChange,
        filteredUsers,
    };
}
