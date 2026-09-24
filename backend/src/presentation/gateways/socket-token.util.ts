import { Socket } from 'socket.io';

export function accessTokenFromSocket(socket: Socket): string | undefined {
  const auth = socket.handshake.auth as { token?: string } | undefined;
  const query = socket.handshake.query as { token?: string } | undefined;
  const token = auth?.token ?? query?.token;
  if (typeof token === 'string' && token) return token;

  const cookieHeader = socket.handshake.headers.cookie as string | undefined;
  const match = cookieHeader?.match(/(?:^|;\s*)sb_access_token=([^;]+)/);
  return match?.[1];
}