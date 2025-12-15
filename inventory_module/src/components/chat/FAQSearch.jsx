import { useState, useEffect, useRef } from 'react'
import { Search, HelpCircle, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { faqService } from '../../services/faqService.js'

const FAQSearch = ({ onStartChat }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [selectedFaq, setSelectedFaq] = useState(null)
  const debounceTimer = useRef(null)

  // Load initial FAQs on component mount
  useEffect(() => {
    loadInitialFAQs()
  }, [])

  const loadInitialFAQs = async () => {
    // Prevent loading if already searching (but allow initial load)
    if (loading) return
    
    try {
      setInitialLoading(true)
      // Call API without search parameter to get popular FAQs
      const response = await faqService.search({ limit: 10 })
      if (response && response.success) {
        const faqsList = response.data?.faqs || []
        setFaqs(faqsList)
        if (faqsList.length === 0) {
          console.log('No FAQs found in database. Run seed script: npm run seed:faqs')
        }
      } else {
        // If response format is unexpected, still set empty array
        setFaqs([])
      }
    } catch (error) {
      console.error('Error loading initial FAQs:', error)
      // Set empty array on error so loading state clears
      setFaqs([])
      // Don't show error toast on initial load to avoid annoying users
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    if (searchQuery.trim()) {
      // Debounce search
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      debounceTimer.current = setTimeout(() => {
        performSearch()
      }, 300)
    } else {
      // When search is cleared, reload initial FAQs (only if not currently searching)
      if (!loading) {
        loadInitialFAQs()
      }
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchQuery])

  const performSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      const response = await faqService.search({ search: searchQuery, limit: 10 })
      if (response.success) {
        setFaqs(response.data.faqs || [])
        
        // Log search interaction
        await faqService.logInteraction({ action: 'viewed' })
      }
    } catch (error) {
      console.error('Error searching FAQs:', error)
      toast.error('Failed to search FAQs')
    } finally {
      setLoading(false)
    }
  }

  const handleFaqClick = async (faq) => {
    // Toggle FAQ: if clicking the same FAQ that's already open, close it
    if (selectedFaq?.faq_id === faq.faq_id) {
      setSelectedFaq(null)
    } else {
      setSelectedFaq(faq)
      
      // Log click interaction only when opening (not closing)
      try {
        await faqService.logInteraction({ faq_id: faq.faq_id, action: 'clicked' })
      } catch (error) {
        console.error('Error logging interaction:', error)
      }
    }
  }

  const handleHelpful = async (faq, helpful) => {
    try {
      await faqService.markHelpful(faq.faq_id, helpful)
      await faqService.logInteraction({ 
        faq_id: faq.faq_id, 
        action: helpful ? 'helpful' : 'not_helpful' 
      })
      toast.success(`Thank you for your feedback!`)
      
      // Update local state
      setFaqs(faqs.map(f => 
        f.faq_id === faq.faq_id 
          ? { 
              ...f, 
              helpful_count: helpful ? f.helpful_count + 1 : f.helpful_count,
              not_helpful_count: !helpful ? f.not_helpful_count + 1 : f.not_helpful_count
            }
          : f
      ))
    } catch (error) {
      console.error('Error marking FAQ as helpful:', error)
      toast.error('Failed to submit feedback')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3 scrollbar-thin scrollbar-thumb-slate-300/80 scrollbar-track-transparent">
        {initialLoading && (
          <div className="text-center text-slate-500 py-8">Loading FAQs...</div>
        )}

        {!initialLoading && loading && (
          <div className="text-center text-slate-500 py-8">Searching...</div>
        )}

        {!initialLoading && !loading && searchQuery && faqs.length === 0 && (
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No FAQs found for "{searchQuery}"</p>
            <button
              onClick={onStartChat}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 mx-auto shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Still need help? Chat with admin
            </button>
          </div>
        )}

        {!initialLoading && !loading && !searchQuery && faqs.length === 0 && (
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No FAQs available at the moment</p>
            <button
              onClick={onStartChat}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 mx-auto shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Still need help? Chat with admin
            </button>
          </div>
        )}

        {!initialLoading && !loading && faqs.length > 0 && (
          <div className="space-y-4">
            {!searchQuery && faqs.length > 0 && (
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Popular FAQs</h3>
                <p className="text-xs text-slate-500 mt-1">Browse common questions or search above</p>
              </div>
            )}
            {searchQuery && faqs.length > 0 && (
              <div className="mb-2">
                <p className="text-sm text-slate-600">
                  Found {faqs.length} result{faqs.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              </div>
            )}
            {faqs.map((faq) => (
              <div
                key={faq.faq_id}
                className={`border border-slate-200 bg-white rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-colors ${
                  selectedFaq?.faq_id === faq.faq_id ? 'border-blue-500 bg-blue-50 shadow' : ''
                }`}
                onClick={() => handleFaqClick(faq)}
              >
                <div className="font-semibold text-slate-900 mb-2">{faq.question}</div>
                {selectedFaq?.faq_id === faq.faq_id && (
                  <>
                    <div className="text-slate-700 mb-4 whitespace-pre-wrap leading-relaxed">{faq.answer}</div>
                    <div className="flex items-center gap-4 pt-3 border-t border-slate-200">
                      <span className="text-sm text-slate-500">Was this helpful?</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleHelpful(faq, true)
                        }}
                        className="flex items-center gap-1 text-sm text-slate-600 hover:text-green-600 px-2 py-1 rounded-lg hover:bg-green-50"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Yes ({faq.helpful_count})
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleHelpful(faq, false)
                        }}
                        className="flex items-center gap-1 text-sm text-slate-600 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        No ({faq.not_helpful_count})
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {faqs.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={onStartChat}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Still need help? Chat with admin
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FAQSearch

