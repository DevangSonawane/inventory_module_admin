import { format } from 'date-fns'
import Badge from '../common/Badge'

const ConversationItem = ({ conversation, isSelected, onClick, unreadCount = 0 }) => {
  const employeeName = conversation.employee?.name || 'Unknown'
  const lastMessageTime = conversation.last_message_at
    ? format(new Date(conversation.last_message_at), 'MMM dd, HH:mm')
    : ''

  const statusColors = {
    open: 'warning',
    active: 'primary',
    resolved: 'success',
    closed: 'default'
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-slate-100 cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-50/70 border-l-4 border-l-blue-600 shadow-inner'
          : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900 truncate max-w-[180px]">{employeeName}</h4>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[11px] rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">{lastMessageTime}</p>
        </div>
        <Badge variant={statusColors[conversation.status] || 'default'}>
          {conversation.status}
        </Badge>
      </div>
    </div>
  )
}

export default ConversationItem

