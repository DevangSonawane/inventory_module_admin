import apiClient from '../utils/apiClient.js';
import { API_BASE_URL } from '../utils/constants.js';

/**
 * Helper function to download file with authentication
 */
const downloadFile = async (url, filename) => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

export const exportService = {
  exportMaterials: async (format = 'csv', params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/inventory/export/materials?format=${format}${queryString ? `&${queryString}` : ''}`;
    await downloadFile(url, `materials_${new Date().toISOString().split('T')[0]}.csv`);
  },

  exportInward: async (format = 'csv', params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/inventory/export/inward?format=${format}${queryString ? `&${queryString}` : ''}`;
    await downloadFile(url, `inward_entries_${new Date().toISOString().split('T')[0]}.csv`);
  },

  exportStockLevels: async (format = 'csv', params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/inventory/export/stock-levels?format=${format}${queryString ? `&${queryString}` : ''}`;
    await downloadFile(url, `stock_levels_${new Date().toISOString().split('T')[0]}.csv`);
  },

  exportMaterialRequests: async (format = 'csv', params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/inventory/export/material-request?format=${format}${queryString ? `&${queryString}` : ''}`;
    await downloadFile(url, `material_requests_${new Date().toISOString().split('T')[0]}.csv`);
  },

  exportStockTransfers: async (format = 'csv', params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/inventory/export/stock-transfer?format=${format}${queryString ? `&${queryString}` : ''}`;
    await downloadFile(url, `stock_transfers_${new Date().toISOString().split('T')[0]}.csv`);
  },

  exportConsumption: async (format = 'csv', params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/inventory/export/consumption?format=${format}${queryString ? `&${queryString}` : ''}`;
    await downloadFile(url, `consumption_records_${new Date().toISOString().split('T')[0]}.csv`);
  },
};

