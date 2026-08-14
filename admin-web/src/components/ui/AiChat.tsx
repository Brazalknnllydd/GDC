import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { apiClient } from '../../lib/api';

type Message = {
  role: 'user' | 'model';
  text: string;
};

export function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your GDC Admin Assistant. Ask me anything about your sales, products, or customers.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userMessage } as Message];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await apiClient.post<{ response: string }>('/chatbot/message', {
        message: userMessage,
        history: messages.slice(1),
      });
      setMessages([...newMessages, { role: 'model', text: response.response }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'model', text: 'I encountered an error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          color: 'white',
          border: 'none',
          boxShadow: 'var(--shadow-lg)',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 50,
          transition: 'transform 0.2s',
        }}
      >
        <Bot size={28} />
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '380px',
          height: '500px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-glass)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 50,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-base)' }}>
            <div className="flex items-center gap-2">
              <Bot size={20} color="var(--primary)" />
              <div style={{ fontWeight: 600 }}>AI Assistant</div>
            </div>
            <button className="icon-btn" onClick={() => setIsOpen(false)}><X size={18} /></button>
          </div>

          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-base)',
                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : 'var(--radius-lg)',
                borderBottomLeftRadius: msg.role === 'model' ? '4px' : 'var(--radius-lg)',
                maxWidth: '85%',
                fontSize: '0.875rem',
                lineHeight: 1.5,
              }}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-lg)', fontSize: '0.875rem' }}>
                <span className="animate-pulse-slow">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-base)' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ask about sales or products..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={{ paddingRight: '2.5rem' }}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: input.trim() && !isLoading ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
