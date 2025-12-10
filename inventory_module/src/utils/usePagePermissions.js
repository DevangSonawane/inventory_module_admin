import { useState, useEffect } from 'react';
import { pagePermissionService } from '../services/pagePermissionService.js';
import { useAuth } from './useAuth.js';

export const usePagePermissions = () => {
  const { user, isAdmin } = useAuth();
  const [allowedPages, setAllowedPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        // Admins always have access to all pages
        if (isAdmin) {
          setAllowedPages([]); // Empty array means all pages allowed
          setLoading(false);
          return;
        }

        if (!user) {
          setLoading(false);
          return;
        }

        const response = await pagePermissionService.getMyEffectivePermissions();
        if (response.success) {
          const pageIds = response.data || [];
          // If no permissions set, allow all (empty array = all allowed)
          setAllowedPages(pageIds);
        }
      } catch (error) {
        console.error('Error fetching page permissions:', error);
        // On error, allow all pages (fail open)
        setAllowedPages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user, isAdmin]);

  const hasAccess = (pageId) => {
    // Admins always have access
    if (isAdmin) return true;
    
    // If no permissions set (empty array), allow all
    if (allowedPages.length === 0) return true;
    
    // Check if page is in allowed list
    return allowedPages.includes(pageId);
  };

  return { allowedPages, hasAccess, loading };
};

