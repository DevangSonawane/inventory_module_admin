import { useState, useEffect } from 'react';

/**
 * Custom hook to monitor network connectivity status
 * Uses navigator.onLine API and online/offline events
 * 
 * @returns {Object} Network status object
 * @returns {boolean} isOnline - Current online status
 * @returns {boolean} wasOffline - Whether the device was offline at some point
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(online);
    setWasOffline(!online);

    // Handle online event
    const handleOnline = () => {
      setIsOnline(true);
      // Keep wasOffline true if it was offline before
    };

    // Handle offline event
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
};
