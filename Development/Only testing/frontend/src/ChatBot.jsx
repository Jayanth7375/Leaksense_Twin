import { useState, useEffect, useRef } from 'react'
import { Iphone16Pro } from './Iphone16Pro'

const API_BASE = 'http://localhost:8000'

// Phone dimensions
const PW = 368   // phone width  — wider
const PH = 590   // phone height — shorter
const PAD = 21   // SVG screen inset
const SR = 40    // screen border-radius (scaled)
const IW = 90    // island width
const IH = 29    // island height

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your LeakSense AI Advisor powered by Groq LLaMA 3.3. How can I help you with your Cat C18 diagnostics today?', source: 'system' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState('unknown')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatHistory, isLoading])

  useEffect(() => {
    if (!isOpen) return
    fetch(`${API_BASE}/api/health`)
      .then(r => r.ok ? setBackendStatus('online') : setBackendStatus('offline'))
      .catch(() => setBackendStatus('offline'))
  }, [isOpen])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const userMsg = { role: 'user', content: message }
    setChatHistory(prev => [...prev, userMsg])
    const sentMessage = message
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE}/api/chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sentMessage,
          history: chatHistory.filter(m => m.role !== 'system'),
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 100)}`)
      }

      const data = await response.json()
      const isFallback = data.source === 'fallback' || data.source === 'offline_fallback'
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: data.response, source: data.source || 'api', isFallback, apiError: data.api_error }
      ])
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: `Could not reach the backend. Make sure the server is running at ${API_BASE}.\n\nError: ${err.message}`, source: 'error', isFallback: true }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const statusColor = backendStatus === 'online'
    ? 'var(--accent-emerald)'
    : backendStatus === 'offline'
    ? 'var(--accent-red)'
    : 'var(--accent-yellow)'

  return (
    <>
      {/* Toggle button */}
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(o => !o)}
        title="AI Advisor"
        style={{ zIndex: 1001 }}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* iPhone-framed chat window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '24px',
          width: PW,
          height: PH,
          zIndex: 1000,
          animation: 'chatPhoneIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          {/* Phone SVG frame */}
          <Iphone16Pro
            width={PW}
            height={PH}
            screenRadius={SR}
            islandWidth={IW}
            islandHeight={IH}
            shadow
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
          />

          {/* Chat content overlaid on screen area */}
          <div style={{
            position: 'absolute',
            top: PAD,
            left: PAD,
            width: PW - PAD * 2,
            height: PH - PAD * 2,
            borderRadius: SR,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-base)',
            zIndex: 2,
          }}>

            {/* Island spacer */}
            <div style={{ height: IH + 14, flexShrink: 0 }} />

            {/* Header */}
            <div style={{
              padding: '8px 14px 8px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,192,0,0.15)',
                  border: '1px solid rgba(255,192,0,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    <circle cx="17" cy="9" r="2" fill="var(--accent-yellow)" stroke="none"/>
                    <line x1="17" y1="7" x2="17" y2="5" stroke="var(--accent-yellow)" strokeWidth="1.5"/>
                    <line x1="15.5" y1="7.5" x2="14" y2="6" stroke="var(--accent-yellow)" strokeWidth="1.5"/>
                    <line x1="18.5" y1="7.5" x2="20" y2="6" stroke="var(--accent-yellow)" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>AI Advisor</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>Groq · LLaMA 3.3 · Cat C18</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Connecting'}
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              scrollbarWidth: 'none',
            }}>
              {chatHistory.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%',
                    padding: '8px 11px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user'
                      ? 'var(--accent-yellow)'
                      : msg.isFallback ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.06)',
                    border: msg.role === 'user'
                      ? 'none'
                      : msg.isFallback ? '1px solid rgba(239,68,68,0.25)' : '1px solid var(--border-subtle)',
                    color: msg.role === 'user' ? '#000' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                    {msg.source === 'groq' && (
                      <div style={{ marginTop: 4, fontSize: '0.58rem', color: 'var(--accent-yellow)', opacity: 0.7 }}>Groq · LLaMA 3.3</div>
                    )}
                    {msg.isFallback && msg.source !== 'system' && (
                      <div style={{ marginTop: 4, fontSize: '0.58rem', color: 'var(--accent-red)', opacity: 0.7 }}>Offline mode</div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: '14px 14px 14px 4px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
                    display: 'flex', gap: '4px', alignItems: 'center',
                  }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--text-muted)',
                        animation: `bounce 1s ${d}s infinite`,
                        display: 'inline-block',
                      }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suggestion chips */}
            {chatHistory.length <= 1 && !isLoading && (
              <div style={{ padding: '0 10px 8px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {['Leak zones?', 'Energy Field?', 'Sensor status'].map(q => (
                  <button
                    key={q}
                    onClick={() => {
                      setMessage(q)
                      setTimeout(() => document.querySelector('.phone-send-btn')?.click(), 50)
                    }}
                    style={{
                      padding: '4px 9px', borderRadius: 12,
                      background: 'rgba(255,192,0,0.08)',
                      border: '1px solid rgba(255,192,0,0.25)',
                      color: 'var(--accent-yellow)', fontSize: '0.65rem', fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} style={{
              padding: '8px 10px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)',
              flexShrink: 0,
            }}>
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={isLoading}
                placeholder="Ask about zones, sensors…"
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 20,
                  padding: '7px 12px',
                  fontSize: '0.72rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-yellow)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
              />
              <button
                type="submit"
                className="phone-send-btn"
                disabled={isLoading || !message.trim()}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: message.trim() && !isLoading ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.08)',
                  border: 'none', cursor: message.trim() && !isLoading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={message.trim() && !isLoading ? '#000' : 'var(--text-muted)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  )
}
