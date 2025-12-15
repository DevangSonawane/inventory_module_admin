import { get, post, put } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const chatService = {
  getConversations: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.CHAT_CONVERSATIONS}?${queryString}` : API_ENDPOINTS.CHAT_CONVERSATIONS;
    return await get(url);
  },

  getConversation: async (id) => {
    return await get(API_ENDPOINTS.CHAT_CONVERSATION_BY_ID(id));
  },

  createConversation: async () => {
    return await post(API_ENDPOINTS.CHAT_CONVERSATIONS, {});
  },

  sendMessage: async (conversationId, message) => {
    return await post(API_ENDPOINTS.CHAT_CONVERSATION_MESSAGES(conversationId), { message });
  },

  markAsRead: async (conversationId) => {
    return await put(API_ENDPOINTS.CHAT_CONVERSATION_READ(conversationId), {});
  },

  updateStatus: async (conversationId, status) => {
    return await put(API_ENDPOINTS.CHAT_CONVERSATION_STATUS(conversationId), { status });
  },

  getUnreadCount: async () => {
    return await get(API_ENDPOINTS.CHAT_UNREAD_COUNT);
  },

  searchConversations: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.CHAT_CONVERSATIONS_SEARCH}?${queryString}` : API_ENDPOINTS.CHAT_CONVERSATIONS_SEARCH;
    return await get(url);
  },
};

