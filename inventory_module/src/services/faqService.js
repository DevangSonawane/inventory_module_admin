import { get, post, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const faqService = {
  search: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.CHAT_FAQS}?${queryString}` : API_ENDPOINTS.CHAT_FAQS;
    return await get(url);
  },

  getById: async (id) => {
    return await get(API_ENDPOINTS.CHAT_FAQ_BY_ID(id));
  },

  create: async (faqData) => {
    return await post(API_ENDPOINTS.CHAT_FAQS, faqData);
  },

  update: async (id, faqData) => {
    return await put(API_ENDPOINTS.CHAT_FAQ_BY_ID(id), faqData);
  },

  delete: async (id) => {
    return await del(API_ENDPOINTS.CHAT_FAQ_BY_ID(id));
  },

  markHelpful: async (id, helpful) => {
    return await post(API_ENDPOINTS.CHAT_FAQ_HELPFUL(id), { helpful });
  },

  logInteraction: async (interactionData) => {
    return await post(API_ENDPOINTS.CHAT_FAQ_INTERACTION, interactionData);
  },
};

