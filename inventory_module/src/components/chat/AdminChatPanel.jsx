import { useState, useEffect } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import ConversationItem from './ConversationItem'
import ChatMessageList from './ChatMessageList'
import ChatInput from './ChatInput'
import { chatService } from '../../services/chatService.js'
import { toast } from 'react-toastify'

const AdminChatPanel = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  conversation,
  messages,
  currentUserId,
  typingUser,
  onSendMessage,
  sending,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredConversations, setFilteredConversations] = useState(conversations)

  // Filter conversations based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredConversations(
        conversations.filter(conv => {
          const employeeName = conv.employee?.name?.toLowerCase() || ''
          return employeeName.includes(query)
        })
      )
    }
  }, [searchQuery, conversations])

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh()
    }
  }

  return (
    <div className="flex h-full bg-slate-50">
      {/* Conversations List */}
      <div className="w-[38%] min-w-[220px] border-r border-slate-200 flex flex-col bg-white">
        <div className="p-3 border-b border-slate-200 space-y-2 sticky top-0 bg-white z-10">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>
          <button
            onClick={handleRefresh}
            className="w-full mt-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
          <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.conversation_id}
                conversation={conv}
                isSelected={selectedConversationId === conv.conversation_id}
                onClick={() => onSelectConversation(conv.conversation_id)}
                unreadCount={conv.unreadCount || 0}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {conversation ? (
          <>
            <div className="p-4 border-b border-slate-200 bg-white">
              <h4 className="font-semibold text-slate-900">
                {conversation.employee?.name || 'Unknown User'}
              </h4>
              <p className="text-sm text-slate-500">{conversation.employee?.email || ''}</p>
            </div>
            <ChatMessageList
              messages={messages}
              currentUserId={currentUserId}
              typingUser={typingUser}
            />
            <ChatInput
              onSendMessage={onSendMessage}
              disabled={sending}
              conversationId={conversation?.conversation_id}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-500">
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminChatPanel

