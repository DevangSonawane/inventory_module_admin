import { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import ChatWindow from './ChatWindow'
import { chatService } from '../../services/chatService.js'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin' || user.email === 'itechseed1@gmail.com'

  useEffect(() => {
    // Fetch unread count
    fetchUnreadCount()

    // Poll for unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await chatService.getUnreadCount()
      if (response.success) {
        setUnreadCount(response.data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full bg-white shadow-lg hover:shadow-xl border border-slate-200 transition-all hover:-translate-y-0.5"
        title="Chat Support"
      >
        <MessageCircle className="w-6 h-6 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[11px] rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isAdmin={isAdmin}
      />
    </>
  )
}

export default ChatWidget

