import { io } from 'socket.io-client';
import { API_BASE_URL } from '../utils/constants.js';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize Socket.IO connection
 */
export const connectSocket = () => {
  if (socket?.connected) {
    return socket;
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.warn('No access token found, cannot connect to socket');
    return null;
  }

  // Extract base URL (remove /api/v1)
  const baseUrl = API_BASE_URL.replace('/api/v1', '');

  socket = io(baseUrl, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS
  });

  socket.on('connect', () => {
    console.log('✅ Connected to chat server');
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from chat server:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
    reconnectAttempts++;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
    }
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  return socket;
};

/**
 * Disconnect Socket.IO connection
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get socket instance
 */
export const getSocket = () => {
  if (!socket || !socket.connected) {
    return connectSocket();
  }
  return socket;
};

/**
 * Join a conversation room
 */
export const joinConversation = (conversationId) => {
  const sock = getSocket();
  if (sock) {
    sock.emit('join_conversation', { conversationId });
  }
};

/**
 * Leave a conversation room
 */
export const leaveConversation = (conversationId) => {
  const sock = getSocket();
  if (sock) {
    sock.emit('leave_conversation', { conversationId });
  }
};

/**
 * Send message via WebSocket
 */
export const sendMessage = (conversationId, message) => {
  const sock = getSocket();
  if (sock) {
    sock.emit('send_message', { conversationId, message });
  }
};

/**
 * Emit typing indicator
 */
export const emitTyping = (conversationId, isTyping) => {
  const sock = getSocket();
  if (sock) {
    sock.emit('typing', { conversationId, isTyping });
  }
};

/**
 * Emit read receipt
 */
export const emitReadReceipt = (conversationId) => {
  const sock = getSocket();
  if (sock) {
    sock.emit('read_receipt', { conversationId });
  }
};

/**
 * Listen to socket events
 */
export const onSocketEvent = (event, callback) => {
  const sock = getSocket();
  if (sock) {
    sock.on(event, callback);
  }
};

/**
 * Remove socket event listener
 */
export const offSocketEvent = (event, callback) => {
  const sock = getSocket();
  if (sock) {
    sock.off(event, callback);
  }
};

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
  joinConversation,
  leaveConversation,
  sendMessage,
  emitTyping,
  emitReadReceipt,
  onSocketEvent,
  offSocketEvent
};

