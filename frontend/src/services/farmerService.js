import { httpClient } from './api';

// Request tracking and caching
const requestCache = new Map();
const pendingRequests = new Map();
const CACHE_DURATION = 30000; // 30 seconds

// Helper to create cache key
const createCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params || {})}`;
};

// Helper to get cached data
const getCachedData = (key) => {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  requestCache.delete(key);
  return null;
};

// Helper to set cached data
const setCachedData = (key, data) => {
  requestCache.set(key, { data, timestamp: Date.now() });
};

// Deduplicate requests
const deduplicateRequest = async (key, requestFn) => {
  // Check cache first
  const cached = getCachedData(key);
  if (cached) {
    return cached;
  }

  // Check if request is already pending
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // Create new request
  const promise = requestFn()
    .then(data => {
      setCachedData(key, data);
      pendingRequests.delete(key);
      return data;
    })
    .catch(error => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, promise);
  return promise;
};

export const farmerService = {
  // Get farmer basic info
  getFarmer: async (id) => {
    const key = createCacheKey(`/farmers/${id}`, null);
    return deduplicateRequest(key, async () => {
      const response = await httpClient.get(`/farmers/${id}`);
      return response.data.data;
    });
  },

  // Get farmer with sensor data
  getFarmerWithSensors: async (id, timeFilter = null, device = null, signal = null, includeScore = false, includeHistory = false) => {
    const params = {};
    if (timeFilter) params.timeFilter = timeFilter;
    if (device) params.device = device;
    if (includeScore) params.includeScore = 'true';
    if (includeHistory) params.includeHistory = 'true';
    
    const key = createCacheKey(`/farmers/${id}/sensors`, params);
    
    // Don't deduplicate if signal is provided (allows cancellation)
    if (signal) {
      const response = await httpClient.get(`/farmers/${id}/sensors`, { params, signal });
      return response.data.data;
    }
    
    return deduplicateRequest(key, async () => {
      const response = await httpClient.get(`/farmers/${id}/sensors`, { params });
      return response.data.data;
    });
  },

  // Update farmer
  updateFarmer: async (id, data) => {
    // Clear cache for this farmer
    const keysToDelete = [];
    for (const key of requestCache.keys()) {
      if (key.includes(`/farmers/${id}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => requestCache.delete(key));
    
    const response = await httpClient.put(`/farmers/${id}`, data);
    return response.data.farmer;
  },

  // Generate QR code
  generateQR: async (id) => {
    const response = await httpClient.post(`/farmers/${id}/qr`);
    return response.data.qrUrl;
  },

  // Mark feedback as viewed
  markFeedbackViewed: async (id) => {
    await httpClient.post(`/farmers/${id}/mark-viewed`);
  },

  // Clear cache (useful for forcing refresh)
  clearCache: () => {
    requestCache.clear();
    pendingRequests.clear();
  }
};
