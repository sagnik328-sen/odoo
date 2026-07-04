import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { aiApi } from '../api/ai'
import { 
  Sparkles, X, Send, Bot, MessageSquare, ShieldAlert,
  Calendar, CreditCard, Clock, Activity, Users
} from 'lucide-react'

export default function AIAssistant() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: `Hello! I am your PeopleFlow AI Assistant. I can help answer questions about your attendance records, leave balances, payroll, or profile details. How can I assist you today?` 
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, isOpen])

  if (!user) return null

  // Determine role-based suggestion chips
  const suggestions = user.role === 'admin'
    ? [
        { label: 'Company payroll analysis', icon: CreditCard },
        { label: 'Employee growth & department performance', icon: Users },
        { label: 'Who is checked in today?', icon: Clock },
      ]
    : user.role === 'hr'
    ? [
        { label: 'Pending leave requests', icon: Calendar },
        { label: 'Who is checked in today?', icon: Clock },
        { label: 'HR system stats', icon: Users },
      ]
    : [
        { label: 'How many leaves do I have?', icon: Calendar },
        { label: 'Show attendance summary', icon: Clock },
        { label: 'Explain my salary details', icon: CreditCard },
      ]

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue
    if (!text.trim()) return

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text }])
    if (!textToSend) setInputValue('')
    setLoading(true)

    try {
      const data = await aiApi.chat(text)
      setMessages(prev => [...prev, { sender: 'ai', text: data.response }])
    } catch (err) {
      console.error("AI assistant error:", err)
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: "Sorry, I encountered an issue retrieving that information. Please check your network connection or try again later." 
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 text-white shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95"
          aria-label="Open AI Assistant"
        >
          {/* Animated pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-indigo-500/30 blur group-hover:bg-indigo-500/50 transition duration-300 animate-pulse"></span>
          <Sparkles className="relative h-6 w-6 animate-bounce" />
        </button>
      )}

      {/* Floating Chat Container */}
      {isOpen && (
        <div className="relative flex flex-col w-[380px] h-[520px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-300 animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-700 via-indigo-800 to-rose-700 text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <Bot className="h-5 w-5 text-indigo-200" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">PeopleFlow Assistant</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] text-slate-200 uppercase tracking-wider font-semibold">Gemini AI</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition"
              aria-label="Close Assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
              const isAi = msg.sender === 'ai'
              return (
                <div key={index} className={`flex gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}>
                  {isAi && (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                    isAi 
                      ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800' 
                      : 'bg-indigo-650 text-white font-medium rounded-tr-none'
                  }`}>
                    {/* Preserve line breaks and display clean markdown lists */}
                    <div className="whitespace-pre-line">
                      {msg.text}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Bouncing Typing Indicator */}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center animate-spin">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length === 1 && !loading && (
            <div className="px-4 py-2 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Suggested queries</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((sug, i) => {
                  const IconComponent = sug.icon
                  return (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(sug.label)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-white dark:bg-slate-800 text-xs text-slate-650 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <IconComponent className="h-3.5 w-3.5" />
                      {sug.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 resize-none max-h-24 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputValue.trim()}
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white shadow-sm transition disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
