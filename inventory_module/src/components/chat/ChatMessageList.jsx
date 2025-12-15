import { useEffect, useRef } from 'react'
import { Check, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'

const ChatMessageList = ({ messages, currentUserId, typingUser }) => {
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingUser])

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <p>No messages yet. Start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-300/80 scrollbar-track-transparent"
    >
      {messages.map((message) => {
        const isOwnMessage = message.sender_id === currentUserId
        const isRead = message.is_read

        return (
          <div
            key={message.message_id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-2 shadow ${
                isOwnMessage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-900 border border-slate-200'
              }`}
            >
              {!isOwnMessage && (
                <div className="text-xs font-semibold mb-1 text-slate-600">
                  {message.sender?.name || 'Unknown'}
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">{message.message}</div>
              <div className={`flex items-center gap-1 mt-1 text-xs ${
                isOwnMessage ? 'text-blue-100' : 'text-slate-500'
              }`}>
                <span>
                  {message.created_at
                    ? format(new Date(message.created_at), 'HH:mm')
                    : ''}
                </span>
                {isOwnMessage && (
                  <span className="ml-1">
                    {isRead ? (
                      <CheckCheck className="w-4 h-4 inline" />
                    ) : (
                      <Check className="w-4 h-4 inline" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
      
      {typingUser && (
        <div className="flex justify-start">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">{typingUser} is typing</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}

export default ChatMessageList

