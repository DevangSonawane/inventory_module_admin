import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Settings, LogOut, Search, Bell, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { authService } from '../../services/authService.js'
import { searchService } from '../../services/searchService.js'
import { notificationService } from '../../services/notificationService.js'

const getPageTitle = (pathname) => {
  const routes = {
    '/': 'Inventory Stock',
    '/inventory-stock': 'Inventory Stock',
    '/add-inward': 'Add Inward',
    '/inward-list': 'Inward List',
    '/material-request': 'Material Request',
    '/stock-transfer': 'Stock Transfer',
    '/stock-transfer-list': 'Stock Transfer List',
    '/record-consumption': 'Record Consumption',
    '/record-consumption-list': 'Consumption List',
    '/settings': 'Settings',
    '/material-management': 'Material Management',
    '/stock-area-management': 'Stock Area Management',
    '/stock-levels': 'Stock Levels',
    '/reports': 'Reports',
    '/notifications': 'Notifications',
    '/audit-trail': 'Audit Trail',
    '/bulk-operations': 'Bulk Operations',
  }
  return routes[pathname] || 'Inventory Management'
}

const TopBar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const pageTitle = getPageTitle(location.pathname)
  const [user, setUser] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const searchRef = useRef(null)
  const notificationRef = useRef(null)

  useEffect(() => {
    // Load user from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (showSearch && searchQuery.trim()) {
      const timer = setTimeout(() => {
        performSearch()
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getAll({ limit: 10 })
      if (response.success) {
        const notifs = response.data.notifications || []
        setNotifications(notifs)
        setUnreadCount(notifs.filter(n => !n.isRead).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const performSearch = async () => {
    if (!searchQuery.trim()) return
    
    try {
      setSearchLoading(true)
      const response = await searchService.global(searchQuery, { limit: 10 })
      if (response.success) {
        setSearchResults(response.data.results || [])
      }
    } catch (error) {
      console.error('Error performing search:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchResultClick = (result) => {
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    
    // Navigate based on entity type
    switch (result.entityType) {
      case 'material':
        navigate(`/material-management/${result.entityId}`)
        break
      case 'inward':
        navigate(`/inward-list`)
        break
      case 'materialRequest':
        navigate(`/material-request`)
        break
      case 'stockTransfer':
        navigate(`/stock-transfer-list`)
        break
      default:
        break
    }
  }

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications(notifications.map(n => 
        n.notification_id === notificationId ? { ...n, isRead: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await authService.logout()
        toast.success('Logged out successfully')
        navigate('/login')
      } catch (error) {
        console.error('Logout error:', error)
        // Clear tokens even if API call fails
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        navigate('/login')
      }
    }
  }

  const userName = user?.name || 'User'

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between relative">
      <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Search"
          >
            <Search className="w-6 h-6 text-gray-700" />
          </button>
          {showSearch && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search materials, inward entries, requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false)
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              {searchLoading && (
                <div className="p-4 text-center text-gray-500">Searching...</div>
              )}
              {!searchLoading && searchResults.length > 0 && (
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{result.title}</div>
                      <div className="text-sm text-gray-500">{result.entityType}</div>
                      {result.description && (
                        <div className="text-xs text-gray-400 mt-1">{result.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {!searchLoading && searchQuery && searchResults.length === 0 && (
                <div className="p-4 text-center text-gray-500">No results found</div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              fetchNotifications()
            }}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-6 h-6 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => navigate('/notifications')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View All
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.notification_id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          handleMarkNotificationAsRead(notification.notification_id)
                        }
                        setShowNotifications(false)
                        navigate('/notifications')
                      }}
                    >
                      <div className="font-medium text-gray-900">{notification.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        <span className="text-lg text-gray-700">
          <span className="font-normal">Hi</span>, {userName}
        </span>
        <button 
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Settings"
        >
          <Settings className="w-6 h-6 text-gray-700" />
        </button>
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Logout"
        >
          <LogOut className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </div>
  )
}

export default TopBar

