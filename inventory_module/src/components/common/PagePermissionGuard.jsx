import { Navigate, useLocation } from 'react-router-dom';
import { usePagePermissions } from '../../utils/usePagePermissions.js';
import { useAuth } from '../../utils/useAuth.js';
import { Loader2 } from 'lucide-react';

const PagePermissionGuard = ({ children }) => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { hasAccess, loading } = usePagePermissions();

  // Extract page ID from path
  // Examples: /inventory-stock -> inventory-stock, /material-request/123 -> material-request
  const getPageIdFromPath = (pathname) => {
    // Remove leading slash and get first segment
    const segments = pathname.split('/').filter(Boolean);
    
    // Map common paths to page IDs
    const pathToPageId = {
      'inventory-stock': 'inventory-stock',
      'add-inward': 'add-inward',
      'inward-list': 'inward-list',
      'material-request': 'material-request',
      'stock-transfer': 'stock-transfer',
      'stock-transfer-list': 'stock-transfer',
      'person-stock': 'person-stock',
      'record-consumption': 'record-consumption',
      'record-consumption-list': 'record-consumption',
      'return-stock': 'return-stock',
      'purchase-request': 'purchase-request',
      'purchase-order': 'purchase-order',
      'business-partner': 'business-partner',
      'material-management': 'material-management',
      'stock-area-management': 'stock-area-management',
      'stock-levels': 'stock-levels',
      'reports': 'reports',
      'audit-trail': 'audit-trail',
      'notifications': 'notifications',
      'bulk-operations': 'bulk-operations',
      'settings': 'settings',
      'admin': 'admin-dashboard', // Default for admin routes
    };

    // Check if first segment matches
    if (segments.length > 0) {
      const firstSegment = segments[0];
      if (pathToPageId[firstSegment]) {
        return pathToPageId[firstSegment];
      }
      
      // For admin routes, check second segment
      if (firstSegment === 'admin' && segments.length > 1) {
        const adminPathMap = {
          'dashboard': 'admin-dashboard',
          'users': 'user-management',
          'approvals': 'approval-center',
          'settings': 'admin-settings',
          'page-permissions': 'page-permissions',
        };
        return adminPathMap[segments[1]] || 'admin-dashboard';
      }
    }

    // Default fallback
    return segments[0] || 'inventory-stock';
  };

  const pageId = getPageIdFromPath(location.pathname);

  // Admins always have access
  if (isAdmin) {
    return children;
  }

  // Wait for permissions to load
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  // If pageId is null (unknown page), allow access (fail open)
  if (pageId === null) {
    return children;
  }

  // Check if user has access to this page
  if (!hasAccess(pageId)) {
    // Redirect to inventory-stock (default page)
    return <Navigate to="/inventory-stock" replace />;
  }

  return children;
};

export default PagePermissionGuard;

