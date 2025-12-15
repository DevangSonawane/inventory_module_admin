import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { emitTyping } from '../../services/chatSocket.js'

const ChatInput = ({ onSendMessage, disabled = false, conversationId = null }) => {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const typingTimer = useRef(null)

  const handleInputChange = (e) => {
    setMessage(e.target.value)

    // Emit typing indicator
    if (conversationId) {
      if (!isTyping) {
        setIsTyping(true)
        emitTyping(conversationId, true)
      }

      // Clear existing timer
      if (typingTimer.current) {
        clearTimeout(typingTimer.current)
      }

      // Stop typing after 3 seconds of inactivity
      typingTimer.current = setTimeout(() => {
        setIsTyping(false)
        emitTyping(conversationId, false)
      }, 3000)
    }
  }

  const handleSend = () => {
    if (!message.trim() || disabled) return

    const messageText = message.trim()
    setMessage('')
    
    // Stop typing indicator
    if (isTyping && conversationId) {
      setIsTyping(false)
      emitTyping(conversationId, false)
    }

    if (typingTimer.current) {
      clearTimeout(typingTimer.current)
    }

    onSendMessage(messageText)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current)
      }
      if (isTyping && conversationId) {
        emitTyping(conversationId, false)
      }
    }
  }, [conversationId, isTyping])

  return (
    <div className="p-4 border-t border-slate-200 bg-white">
      <div className="flex items-end gap-2">
        <textarea
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={disabled}
          rows={1}
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
          style={{ minHeight: '44px', maxHeight: '140px' }}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-2 text-[11px] text-slate-500">Press Enter to send • Shift+Enter for newline</div>
    </div>
  )
}

export default ChatInput

