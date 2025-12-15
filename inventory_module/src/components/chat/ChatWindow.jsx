import { useState, useEffect, useCallback } from 'react'
import { X, MessageCircle, HelpCircle } from 'lucide-react'
import FAQSearch from './FAQSearch'
import ChatMessageList from './ChatMessageList'
import ChatInput from './ChatInput'
import AdminChatPanel from './AdminChatPanel'
import { chatService } from '../../services/chatService.js'
import { 
  getSocket, 
  joinConversation, 
  leaveConversation, 
  onSocketEvent, 
  offSocketEvent,
  emitReadReceipt 
} from '../../services/chatSocket.js'
import { toast } from 'react-toastify'

const ChatWindow = ({ isOpen, onClose, isAdmin = false }) => {
  const [activeTab, setActiveTab] = useState('faq') // 'faq' or 'chat'
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [typingUser, setTypingUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const defaultSize = { width: 420, height: 620 }
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatWindowSize')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return {
            width: parsed.width || defaultSize.width,
            height: parsed.height || defaultSize.height
          }
        } catch (_) { /* ignore */ }
      }
    }
    return defaultSize
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const currentUserId = user.id || user.user_id

  useEffect(() => {
    if (isOpen) {
      // Connect socket if not connected
      getSocket()

      // Set up socket listeners
      const handleNewMessage = (data) => {
        if (data.message) {
          const msg = data.message
          // Only add if it's for the current conversation
          if (!selectedConversationId || msg.conversation_id === selectedConversationId) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.message_id === msg.message_id)) {
                return prev
              }
              return [...prev, msg]
            })
          }
        }
      }

      const handleTyping = (data) => {
        if (data.conversationId === selectedConversationId) {
          if (data.isTyping) {
            setTypingUser(data.userName)
          } else {
            setTypingUser(null)
          }
        }
      }

      const handleReadReceipt = (data) => {
        // Update read status in messages
        setMessages(prev => prev.map(msg => 
          msg.sender_id === currentUserId && msg.conversation_id === data.conversationId
            ? { ...msg, is_read: true }
            : msg
        ))
      }

      const handleNewConversation = (data) => {
        if (isAdmin && data.conversation) {
          // Refresh conversations list
          loadConversations()
        }
      }

      onSocketEvent('new_message', handleNewMessage)
      onSocketEvent('typing', handleTyping)
      onSocketEvent('read_receipt', handleReadReceipt)
      if (isAdmin) {
        onSocketEvent('new_conversation', handleNewConversation)
      }

      // Load conversations
      if (isAdmin) {
        loadConversations()
      } else {
        loadUserConversation()
      }

      return () => {
        offSocketEvent('new_message', handleNewMessage)
        offSocketEvent('typing', handleTyping)
        offSocketEvent('read_receipt', handleReadReceipt)
        if (isAdmin) {
          offSocketEvent('new_conversation', handleNewConversation)
        }
      }
    }
  }, [isOpen, isAdmin, selectedConversationId, currentUserId])

  useEffect(() => {
    if (selectedConversationId && isOpen) {
      loadConversation(selectedConversationId)
      joinConversation(selectedConversationId)
      
      // Mark as read
      chatService.markAsRead(selectedConversationId).catch(console.error)
      emitReadReceipt(selectedConversationId)

      return () => {
        leaveConversation(selectedConversationId)
      }
    }
  }, [selectedConversationId, isOpen])

  const loadUserConversation = async () => {
    try {
      setLoading(true)
      const response = await chatService.getConversations()
      if (response.success && response.data.conversations && response.data.conversations.length > 0) {
        const conv = response.data.conversations[0]
        setConversation(conv)
        setSelectedConversationId(conv.conversation_id)
        await loadConversation(conv.conversation_id)
        setActiveTab('chat')
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async () => {
    try {
      setLoading(true)
      const response = await chatService.getConversations()
      if (response.success) {
        setConversations(response.data.conversations || [])
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversation = async (conversationId) => {
    try {
      const response = await chatService.getConversation(conversationId)
      if (response.success) {
        setConversation(response.data.conversation)
        setMessages(response.data.messages || [])
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
      toast.error('Failed to load conversation')
    }
  }

  const handleStartChat = async () => {
    try {
      setLoading(true)
      const response = await chatService.createConversation()
      
      // Handle successful conversation creation
      if (response.success && response.data?.conversation) {
        const newConv = response.data.conversation
        setConversation(newConv)
        setSelectedConversationId(newConv.conversation_id)
        setActiveTab('chat')
        await loadConversation(newConv.conversation_id)
        joinConversation(newConv.conversation_id)
      } 
      // Handle existing conversation case (API returns success: false but with conversation data)
      else if (response.code === 'EXISTING_CONVERSATION' && response.data?.conversation) {
        const existingConv = response.data.conversation
        setConversation(existingConv)
        setSelectedConversationId(existingConv.conversation_id)
        setActiveTab('chat')
        await loadConversation(existingConv.conversation_id)
        joinConversation(existingConv.conversation_id)
      }
      // If response indicates user already has a conversation, try to load it
      else {
        // Try to load existing conversation
        const conversationsResponse = await chatService.getConversations()
        if (conversationsResponse.success && conversationsResponse.data?.conversations?.length > 0) {
          const existingConv = conversationsResponse.data.conversations[0]
          setConversation(existingConv)
          setSelectedConversationId(existingConv.conversation_id)
          setActiveTab('chat')
          await loadConversation(existingConv.conversation_id)
          joinConversation(existingConv.conversation_id)
        } else {
          toast.error(response.message || 'Failed to start conversation')
        }
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      
      // Check if error is due to existing conversation (400 status with EXISTING_CONVERSATION code)
      const errorData = error.data || error.response?.data
      if (error.status === 400 && errorData?.code === 'EXISTING_CONVERSATION' && errorData?.data?.conversation) {
        // User already has a conversation - use it
        const existingConv = errorData.data.conversation
        setConversation(existingConv)
        setSelectedConversationId(existingConv.conversation_id)
        setActiveTab('chat')
        await loadConversation(existingConv.conversation_id)
        joinConversation(existingConv.conversation_id)
      } else {
        // Try to load existing conversation as fallback
        try {
          const conversationsResponse = await chatService.getConversations()
          if (conversationsResponse.success && conversationsResponse.data?.conversations?.length > 0) {
            const existingConv = conversationsResponse.data.conversations[0]
            setConversation(existingConv)
            setSelectedConversationId(existingConv.conversation_id)
            setActiveTab('chat')
            await loadConversation(existingConv.conversation_id)
            joinConversation(existingConv.conversation_id)
          } else {
            toast.error(errorData?.message || error.message || 'Failed to start conversation. Please try again.')
          }
        } catch (loadError) {
          console.error('Error loading conversation:', loadError)
          toast.error(errorData?.message || error.message || 'Failed to start conversation. Please try again.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (messageText) => {
    if (!conversation || !messageText.trim()) return

    try {
      setSending(true)
      const response = await chatService.sendMessage(conversation.conversation_id, messageText)
      if (response.success) {
        // Message will be added via socket event
        // But add it immediately for better UX
        setMessages(prev => [...prev, response.data.message])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId)
    setActiveTab('chat')
  }

  // Clamp dimensions to keep the chat window a reasonable size
  const minW = 360
  const maxW = 540
  const minH = 520
  const maxH = 760

  // Persist window size
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatWindowSize', JSON.stringify(windowSize))
    }
  }, [windowSize])

  const startResize = useCallback((direction, e) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const { width, height } = windowSize
    const viewportMaxWidth = typeof window !== 'undefined' ? Math.max(minW, window.innerWidth - 24) : maxW
    const viewportMaxHeight = typeof window !== 'undefined' ? Math.max(minH, window.innerHeight - 24) : maxH

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      let newWidth = width
      let newHeight = height
      if (direction.includes('right')) {
        newWidth = Math.min(Math.max(width + dx, minW), Math.min(maxW, viewportMaxWidth))
      }
      if (direction.includes('left')) {
        newWidth = Math.min(Math.max(width - dx, minW), Math.min(maxW, viewportMaxWidth))
      }
      if (direction.includes('bottom')) {
        newHeight = Math.min(Math.max(height + dy, minH), Math.min(maxH, viewportMaxHeight))
      }
      if (direction.includes('top')) {
        newHeight = Math.min(Math.max(height - dy, minH), Math.min(maxH, viewportMaxHeight))
      }
      setWindowSize({ width: newWidth, height: newHeight })
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [windowSize, minW, maxW, minH, maxH])

  if (!isOpen) return null

  return (
    <div
      className="fixed bottom-5 right-5 bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.25)] border border-slate-200/80 flex flex-col z-50 overflow-hidden"
      style={{
        width: `${windowSize.width}px`,
        height: `${windowSize.height}px`,
        maxWidth: '92vw',
        maxHeight: '85vh',
        minWidth: `${minW}px`,
        minHeight: `${minH}px`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-t-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
            <MessageCircle className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-base tracking-tight">
            {isAdmin ? 'Admin Chat' : 'Chat Support'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full transition-all"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Tabs */}
      {!isAdmin && (
        <div className="flex border-b border-slate-200 px-4 pt-2 gap-2 bg-white">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-full transition-colors ${
              activeTab === 'faq'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4 inline mr-2" />
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-full transition-colors ${
              activeTab === 'chat'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Chat
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
        {isAdmin ? (
          <AdminChatPanel
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            conversation={conversation}
            messages={messages}
            currentUserId={currentUserId}
            typingUser={typingUser}
            onSendMessage={handleSendMessage}
            sending={sending}
            onRefresh={loadConversations}
          />
        ) : (
          <>
            {activeTab === 'faq' && (
              <FAQSearch onStartChat={handleStartChat} />
            )}
            {activeTab === 'chat' && (
              <>
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-slate-500">Loading...</div>
                  </div>
                ) : conversation ? (
                  <>
                    <ChatMessageList
                      messages={messages}
                      currentUserId={currentUserId}
                      typingUser={typingUser}
                    />
                    <ChatInput
                      onSendMessage={handleSendMessage}
                      disabled={sending}
                      conversationId={conversation?.conversation_id}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                      <p className="text-slate-500 mb-4">No active conversation</p>
                      <button
                        onClick={handleStartChat}
                        className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm"
                      >
                        Start Conversation
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Resizers: right, bottom, and top-left corner only (indicator) */}
      <div
        className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
        onMouseDown={(e) => startResize('right', e)}
        style={{ background: 'rgba(0,0,0,0.05)' }}
      />
      <div
        className="absolute left-0 bottom-0 h-2 w-full cursor-ns-resize"
        onMouseDown={(e) => startResize('bottom', e)}
        style={{ background: 'rgba(0,0,0,0.05)' }}
      />
      <div
        className="absolute left-0 top-0 h-3 w-3 cursor-nwse-resize"
        onMouseDown={(e) => startResize('left-top', e)}
        style={{ background: 'rgba(0,0,0,0.15)' }}
      />
    </div>
  )
}

export default ChatWindow

