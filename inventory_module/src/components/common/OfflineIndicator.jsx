import { WifiOff, AlertCircle } from 'lucide-react';

/**
 * OfflineIndicator Component
 * Displays a banner at the top of the page when the device is offline
 * 
 * @param {boolean} isOnline - Current online status
 */
const OfflineIndicator = ({ isOnline }) => {
  if (isOnline) {
    return null;
  }

  return (
    <div className="bg-red-600 text-white px-4 py-3 shadow-lg z-50 sticky top-0">
      <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
        <WifiOff className="w-5 h-5" />
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">You are offline</span>
          <span className="text-sm opacity-90">
            - Please check your internet connection. Some features may be unavailable.
          </span>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
