import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/shared/axiosClient';
import { FaComments, FaTimes, FaPaperPlane } from 'react-icons/fa';
import '../../css/shared/AIChatWidget.css';

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role: 'user'|'assistant', text }
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const SUGGESTIONS = [
    'Lá héo, rễ thối',
    'Vàng lá và rụng',
    'Đốm nâu trên lá',
    'Sâu bệnh trên thân',
    'Cây còi cọc, thiếu dinh dưỡng'
  ];

  useEffect(() => {
    // load persisted small history if any
    try {
      const raw = localStorage.getItem('ai_chat_history');
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('ai_chat_history', JSON.stringify(messages.slice(-20))); } catch {}
    // scroll to bottom when new message
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleOpen = () => setOpen(v => !v);

  const close = () => setOpen(false);

  const send = async () => {
    const text = (input || '').trim();
    if (!text) return;
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      // Prepare messages for API (aiService expects array of { role, content })
      const payloadMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.text }));
      const res = await axiosClient.post('/ai/chat', { messages: payloadMessages });
      const result = res.data?.data?.result || res.data?.data || res.data?.result || res.data;

      // try to extract cause/treatment if provided by backend
      let cause = '';
      let treatment = '';
      let textOut = 'Không có phản hồi';

      try {
        if (result) {
          // prefer explicit fields
          cause = result.cause || (result.structured && result.structured.cause) || '';
          treatment = result.treatment || (result.structured && result.structured.treatment) || '';

          // sometimes result.text contains JSON string
          if ((!cause || !treatment) && result.text && typeof result.text === 'string') {
            try {
              const js = JSON.parse(result.text);
              cause = cause || js.cause || js.nguyenNhan || '';
              treatment = treatment || js.treatment || js.bienPhap || '';
            } catch {}
          }

          // fallback to raw text
          if (result.text) textOut = result.text;
          else if (typeof result === 'string') textOut = result;
          else if (result && result.raw && typeof result.raw === 'string') textOut = result.raw;
        }
      } catch (e) {
        console.warn('AI chat: failed to normalize result', e);
      }

      const assistantMsg = { role: 'assistant', text: textOut, cause, treatment };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AI chat send error', err?.response?.data || err.message || err);
      const assistantMsg = { role: 'assistant', text: 'Lỗi khi gọi AI. Thử lại sau.' };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setSending(false);
      setOpen(true);
    }
  };

  const sendSuggestion = (text) => {
    setInput(text);
    // slight delay so input updates before sending
    setTimeout(() => send(), 50);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="ai-chat-widget">
      {!open && (
        <button className="ai-chat-bubble" onClick={toggleOpen} aria-label="Chat với AI">
          <FaComments size={20} />
        </button>
      )}

      {open && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <div>Chat AI</div>
            <div className="ai-chat-header-actions">
              <button className="btn-close" onClick={close} aria-label="Đóng"><FaTimes /></button>
            </div>
          </div>

          <div className="ai-chat-suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="ai-suggestion-chip" onClick={() => sendSuggestion(s)}>{s}</button>
            ))}
          </div>

          <div className="ai-chat-body">
            {messages.length === 0 && (
              <div className="ai-chat-empty">Xin chào! Hỏi về triệu chứng cây trồng của bạn...</div>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={`ai-chat-message ${m.role === 'assistant' ? 'assistant' : 'user'}`}>
                {m.role === 'assistant' && (
                  <div className="ai-avatar">🤖</div>
                )}

                {/* If assistant provided cause/treatment, render them as two clear sections */}
                {((m.role === 'assistant') && (m.cause || m.treatment)) ? (
                  <div className="ai-chat-text">
                    {m.cause && (
                      <div style={{marginBottom:8}}>
                        <strong>Nguyên nhân:</strong>
                        <div style={{marginTop:6, whiteSpace: 'pre-wrap'}}>{m.cause}</div>
                      </div>
                    )}
                    {m.treatment && (
                      <div>
                        <strong>Biện pháp:</strong>
                        <div style={{marginTop:6, whiteSpace: 'pre-wrap'}}>{m.treatment}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ai-chat-text">{m.text}</div>
                )}

                {m.role === 'user' && (
                  <div className="ai-avatar user-avatar">🙂</div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="ai-chat-input">
            <textarea
              placeholder="Gõ câu hỏi, ấn Enter để gửi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={2}
            />
            <button className="ai-chat-send" onClick={send} disabled={sending} aria-label="Gửi">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
