import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Table from '../components/common/Table'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import { TableSkeleton } from '../components/common/Skeleton'
import { notificationService } from '../services/notificationService.js'
import { format } from 'date-fns'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationService.getAll({ limit: 100 })
      if (response.success) {
        const notifs = response.data.notifications || []
        setNotifications(notifs)
        setUnreadCount(notifs.filter(n => !n.isRead).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId)
      if (response.success) {
        setNotifications(notifications.map(n => 
          n.notification_id === notificationId ? { ...n, isRead: true } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - 1))
        toast.success('Notification marked as read')
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const handleDelete = async (notificationId) => {
    try {
      const response = await notificationService.delete(notificationId)
      if (response.success) {
        setNotifications(notifications.filter(n => n.notification_id !== notificationId))
        if (!notifications.find(n => n.notification_id === notificationId)?.isRead) {
          setUnreadCount(Math.max(0, unreadCount - 1))
        }
        toast.success('Notification deleted')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead)
      await Promise.all(unreadNotifications.map(n => notificationService.markAsRead(n.notification_id)))
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="danger">{unreadCount} unread</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={handleMarkAllAsRead}>
              <Check className="w-4 h-4 mr-2 inline" />
              Mark All as Read
            </Button>
          )}
        </div>

        {loading ? (
          <TableSkeleton rows={10} columns={4} />
        ) : (
          <Table
            headers={['TYPE', 'MESSAGE', 'DATE', 'STATUS', 'ACTIONS']}
          >
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <tr 
                  key={notification.notification_id} 
                  className={`hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge variant={notification.type === 'ALERT' ? 'danger' : notification.type === 'INFO' ? 'primary' : 'warning'}>
                      {notification.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{notification.message}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {notification.createdAt ? format(new Date(notification.createdAt), 'dd-MM-yyyy HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {notification.isRead ? (
                      <Badge variant="success">Read</Badge>
                    ) : (
                      <Badge variant="warning">Unread</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.notification_id)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Mark as Read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.notification_id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No notifications found
                </td>
              </tr>
            )}
          </Table>
        )}
      </div>
    </div>
  )
}

export default Notifications









