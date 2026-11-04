import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // За reverse proxy API живёт на относительном пути (например /api): тогда socket.io идёт на /api/socket.io.
    socket = API_URL.startsWith('/')
      ? io({ path: `${API_URL}/socket.io`, transports: ['websocket'] })
      : io(API_URL, { transports: ['websocket'] });
  }
  return socket;
}
