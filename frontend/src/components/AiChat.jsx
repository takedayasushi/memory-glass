import { useState, useRef, useEffect } from 'react';

export default function AiChat({ user, initialMessage, placeholder }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: initialMessage || 'こんにちは！何でも聞いてください。' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const idToken = await user.getIdToken();
      // Send chat history to backend
      const response = await fetch('https://asia-northeast1-memory-glass-2026.cloudfunctions.net/api/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);
      } else {
        console.error("Chat error:", result.error);
        setMessages(prev => [...prev, { role: 'assistant', content: '申し訳ありません、エラーが発生しました。' }]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: '通信エラーが発生しました。サーバーが起動しているか確認してください。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', padding: '1rem' }}>
      
      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', padding: '0.5rem' }}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? 'var(--accent-color)' : 'rgba(0,0,0,0.3)',
            padding: '0.6rem 0.8rem',
            borderRadius: '12px',
            maxWidth: '85%',
            lineHeight: '1.5',
            fontSize: '0.9rem'
          }}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '12px' }}>
            <span style={{ animation: 'pulse 1s infinite' }}>考え中...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || '質問を入力してください...'}
          className="input-field"
          style={{ flexGrow: 1, padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
          disabled={isLoading}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} disabled={isLoading || !input.trim()}>
          送信
        </button>
      </form>
    </div>
  );
}
