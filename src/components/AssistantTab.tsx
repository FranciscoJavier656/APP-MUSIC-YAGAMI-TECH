import { chatWithGemini } from "../lib/gemini";
import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I am your AI Music Assistant. Looking for high-res jazz albums from the 90s, or curious about the history of a specific genre? Ask me anything!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Send the entire context
      const chatHistory = messages.map(m => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`).join('\\n');
      const fullPrompt = `${chatHistory}\\nUser: ${userMessage.content}\\nAssistant:`;

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || ''}/api/chat`, { message: fullPrompt });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.text || 'Sorry, I could not process that request.'
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'There was an error connecting to the AI service. Please try again later.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full h-[calc(100vh-4rem)]">
      {/* iOS style sticky header with blur */}
      <header className="sticky top-0 z-40 bg-[#F2F2F7]/80 dark:bg-[#000000]/80 backdrop-blur-xl px-8 pt-12 pb-4">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">Asistente</h1>
      </header>

      {/* Chat Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 p-8 overflow-y-auto space-y-6 pb-24"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-[#007AFF] text-white ml-2' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-2'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
              </div>
              <div className={`px-4 py-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-[#007AFF] text-white rounded-tr-sm' 
                  : 'bg-white dark:bg-[#1C1C1E] shadow-sm border border-gray-100 dark:border-gray-800 text-black dark:text-white rounded-tl-sm'
              }`}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex flex-row max-w-[85%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-2">
                <Sparkles size={16} />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-sm border border-gray-100 dark:border-gray-800 rounded-tl-sm flex space-x-1.5 items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-2 text-xs text-purple-500 dark:text-purple-400 font-medium">Thinking intensely...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full bg-[#F2F2F7]/80 dark:bg-[#000000]/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 p-4">
        <form onSubmit={handleSend} className="relative flex items-center max-w-2xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about artists, genres, hi-res..."
            className="w-full pl-4 pr-12 py-3 bg-[#E3E3E8] dark:bg-[#1C1C1E] border-none rounded-xl focus:outline-none focus:ring-0 text-[16px] text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 bg-[#007AFF] text-white rounded-lg disabled:opacity-50 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
