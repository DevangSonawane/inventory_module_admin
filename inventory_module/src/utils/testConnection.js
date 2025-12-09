// Test connection to backend API
import { get } from './apiClient.js';
import { API_ENDPOINTS } from './constants.js';

export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    const response = await get(API_ENDPOINTS.INVENTORY_HEALTH);
    console.log('✅ Backend connection successful:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return { success: false, error };
  }
};

// Auto-test on import (for development)
if (import.meta.env.DEV) {
  testBackendConnection();
}









