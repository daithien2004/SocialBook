import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { SocketProvider, useSocket } from '../SocketProvider';
import { useAppAuth } from '@/features/auth/hooks';
import { Manager } from 'socket.io-client';

// Mock the authentication hook
jest.mock('@/features/auth/hooks', () => ({
  useAppAuth: jest.fn(),
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    connected: false,
    auth: null,
  };
  return {
    Manager: jest.fn(() => ({
      socket: jest.fn(() => mockSocket),
    })),
    Socket: jest.fn(() => mockSocket),
    __mockSocket: mockSocket,
  };
});

describe('SocketProvider', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ioMock = require('socket.io-client');
    mockSocket = ioMock.__mockSocket;
    mockSocket.connected = false;
    (useAppAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SocketProvider>{children}</SocketProvider>
  );

  it('should initialize context correctly', () => {
    const { result } = renderHook(() => useSocket(), { wrapper });
    expect(result.current).toHaveProperty('getSocket');
    expect(result.current).toHaveProperty('connectSocket');
    expect(result.current).toHaveProperty('disconnectAll');
  });

  it('should connect a socket for a specific namespace', async () => {
    const { result } = renderHook(() => useSocket(), { wrapper });

    let socket;
    await act(async () => {
      socket = await result.current.connectSocket('/test-namespace');
    });

    expect(Manager).toHaveBeenCalledTimes(1);
    expect(socket).toBe(mockSocket);
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });

  it('should not reconnect if already connected', async () => {
    mockSocket.connected = true;
    const { result } = renderHook(() => useSocket(), { wrapper });

    await act(async () => {
      await result.current.connectSocket('/test-namespace');
    });

    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it('should disconnect all sockets on logout', () => {
    const { result, rerender } = renderHook(() => useSocket(), { wrapper });

    // Connect first
    act(() => {
      result.current.getSocket('/test1');
      result.current.getSocket('/test2');
    });

    // Simulate logout
    (useAppAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    // Rerender hook to trigger useEffect
    rerender();

    expect(mockSocket.disconnect).toHaveBeenCalledTimes(2);
  });

  it('should clear listeners and disconnect when disconnectAll is called manually', () => {
    const { result } = renderHook(() => useSocket(), { wrapper });

    // Connect
    act(() => {
      result.current.getSocket('/namespace');
    });

    // Manually disconnect
    act(() => {
      result.current.disconnectAll();
    });

    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});
