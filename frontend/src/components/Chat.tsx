'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import debounce from 'lodash.debounce';

const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000') + '/chat';

export default function Chat() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<
    {
      user: string;
      text: string;
      room?: string;
      private?: boolean;
      messageId: string;
      deliveredTo: string[];
      readBy: string[];
    }[]
  >([]);
  const [input, setInput] = useState('');
  const [room, setRoom] = useState('');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [users, setUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messageRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: { token: 'your-jwt-token' },
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => console.log('Connected to socket'));
    newSocket.on('message', (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          readBy: msg.readBy || [],
          deliveredTo: msg.deliveredTo || [],
        },
      ]);
      // emit receipt dựa vào bản chất message
      if (msg.room) {
        newSocket.emit('deliveryReceipt', {
          messageId: msg.messageId,
          room: msg.room,
        });
      } else if (msg.private) {
        newSocket.emit('deliveryReceipt', {
          messageId: msg.messageId,
          to: msg.user, // người gửi tin nhắn
        });
      }
    });
    newSocket.on('userList', (userList: string[]) => setUsers(userList));
    newSocket.on('typing', ({ user, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping && !prev.includes(user)) {
          return [...prev, user];
        } else if (!isTyping && prev.includes(user)) {
          return prev.filter((u) => u !== user);
        }
        return prev;
      });
    });
    newSocket.on('deliveryReceipt', ({ messageId, deliveredTo }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === messageId
            ? {
              ...msg,
              deliveredTo: [...(msg.deliveredTo || []), deliveredTo],
            }
            : msg
        )
      );
    });
    newSocket.on('readReceipt', ({ messageId, readBy }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === messageId
            ? { ...msg, readBy: [...(msg.readBy || []), readBy] }
            : msg
        )
      );
    });
    newSocket.on('disconnect', () => console.log('Disconnected'));

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Intersection Observer để phát hiện tin nhắn hiển thị
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && socket) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId && (currentRoom || recipient)) {
              socket.emit('readMessage', {
                messageId,
                room: currentRoom || undefined,
                to: recipient || undefined,
              });
            }
          }
        });
      },
      { threshold: 0.5 } // Tin nhắn hiển thị 50% thì coi là đã đọc
    );

    messageRefs.current.forEach((ref) => observer.observe(ref));

    return () => {
      messageRefs.current.forEach((ref) => observer.unobserve(ref));
    };
  }, [messages, socket, currentRoom, recipient]);

  // Debounce typing event to avoid spamming server
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
    if (e.target.value) {
      sendTyping(true);
    } else {
      sendTyping(false);
    }
  };

  const joinRoom = () => {
    if (socket && room && !currentRoom) {
      socket.emit('joinRoom', room);
      setCurrentRoom(room);
      setRecipient(null);
      setMessages([]);
      setTypingUsers([]);
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

  const sendMessage = () => {
    if (socket && input) {
      if (currentRoom) {
        socket.emit('message', { room: currentRoom, text: input });
      } else if (recipient) {
        socket.emit('message', { to: recipient, text: input });
      }
      setInput('');
      sendTyping(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Real-Time Chat</h1>
      <div className="my-4">
        <h2 className="text-lg">Online Users</h2>
        <ul className="border p-2">
          {users.map((user) => (
            <li
              key={user}
              className={`cursor-pointer p-1 ${
                recipient === user ? 'bg-blue-100' : ''
                }`}
              onClick={() => {
                if (!currentRoom) setRecipient(user);
              }}
            >
              {user}
            </li>
          ))}
        </ul>
      </div>
      {!currentRoom ? (
        <div className="my-4">
          <input
            className="border p-2 mr-2"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Enter room name"
          />
          <button
            className="bg-blue-500 text-white p-2 rounded"
            onClick={joinRoom}
          >
            Join Room
          </button>
        </div>
      ) : (
        <div className="my-4">
          <p>Current Room: {currentRoom}</p>
          <button
            className="bg-red-500 text-white p-2 rounded"
            onClick={leaveRoom}
          >
            Leave Room
          </button>
        </div>
      )}
      <div className="my-4">
        <p>
          Chatting with:{' '}
          {currentRoom
            ? `Room ${currentRoom}`
            : recipient
              ? `User ${recipient}`
              : 'Select a room or user'}
        </p>
        {typingUsers.length > 0 && (
          <p className="text-gray-500">
            {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'}{' '}
            typing...
          </p>
        )}
      </div>
      <ul className="border p-4 h-64 overflow-y-auto">
        {messages.map((msg, idx) => (
          <li
            key={`${msg.messageId}-${idx}`}
            data-message-id={msg.messageId}
            ref={
              socket &&
                socket.id &&
                !msg.readBy.includes(socket.id) &&
                msg.user !== socket.id
                ? (el) => {
                  if (el) {
                    messageRefs.current.set(msg.messageId, el);
                  } else {
                    messageRefs.current.delete(msg.messageId);
                  }
                }
                : null
            }
            className="flex items-center"
          >
            <span>
              {msg.private
                ? `(Private) ${msg.user}: ${msg.text}`
                : `${msg.user} (${msg.room || 'private'}): ${msg.text}`}
            </span>
            <span className="ml-2">
              {msg.deliveredTo.length === 1 ? (
                <svg
                  className="w-4 h-4 text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M20 6L9 17l-5-5" strokeWidth="2" />
                </svg>
              ) : msg.readBy.length > 1 ? (
                <svg
                  className="w-4 h-4 text-green-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M20 6L9 17l-5-5" strokeWidth="2" />
                  <path d="M14 6l-5 5" strokeWidth="2" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-blue-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M20 6L9 17l-5-5" strokeWidth="2" />
                  <path d="M14 6l-5 5" strokeWidth="2" />
                </svg>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <input
          className="border p-2 mr-2 w-3/4"
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message"
          disabled={!currentRoom && !recipient}
        />
        <button
          className="bg-green-500 text-white p-2 rounded"
          onClick={sendMessage}
          disabled={!currentRoom && !recipient}
        >
          Send
        </button>
      </div>
    </div>
  );
}
