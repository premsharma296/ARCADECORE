'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Activity, Send, Trophy, Flame } from 'lucide-react'
import { sound } from '@/lib/sound'
import { useUser } from '@clerk/nextjs'

interface ChatMessage {
  id: string
  username: string
  avatar: string
  text: string
  time: string
  isVip?: boolean
}

interface ActivityPlay {
  id: string
  username: string
  gameName: string
  score: string
  coins: number
  time: string
}

export default function LiveSidebar() {
  const { user } = useUser()
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'activity'>('chat')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [activityPlays, setActivityPlays] = useState<ActivityPlay[]>([])
  const [typedMessage, setTypedMessage] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Fetch real chat logs from database
  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch('/api/realtime/chat')
      if (res.ok) {
        const data = await res.json()
        const formatted = data.map((d: any) => ({
          id: d.id,
          username: d.username,
          avatar: d.avatarUrl,
          text: d.content,
          time: new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isVip: d.isVip
        }))
        setChatMessages(formatted)
      }
    } catch (e) {
      console.error('Failed to load chat:', e)
    }
  }, [])

  // Fetch real game plays from database
  const fetchPlays = useCallback(async () => {
    try {
      const res = await fetch('/api/realtime/plays')
      if (res.ok) {
        const data = await res.json()
        setActivityPlays(data)
      }
    } catch (e) {
      console.error('Failed to load plays:', e)
    }
  }, [])

  // Initial Load
  useEffect(() => {
    fetchChat()
    fetchPlays()
  }, [fetchChat, fetchPlays])

  // Real-Time Database Polling (every 3 seconds for chat and 4 seconds for plays)
  useEffect(() => {
    const chatTimer = setInterval(() => {
      if (activeSubTab === 'chat') {
        fetchChat()
      }
    }, 3000)

    const playsTimer = setInterval(() => {
      if (activeSubTab === 'activity') {
        fetchPlays()
      }
    }, 4000)

    return () => {
      clearInterval(chatTimer)
      clearInterval(playsTimer)
    }
  }, [activeSubTab, fetchChat, fetchPlays])

  // Scroll Chat to Bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, activeSubTab])

  // User message submit handler to write directly to PostgreSQL
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedMessage.trim()) return

    const username = user?.username || user?.firstName || 'GuestPlayer'
    const avatar = user?.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40&auto=format&fit=crop'
    const payload = {
      room: 'global',
      username,
      avatarUrl: avatar,
      content: typedMessage.trim(),
      isVip: true
    }

    setTypedMessage('')
    sound.playClick()

    try {
      await fetch('/api/realtime/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      fetchChat()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="w-full rounded-2xl bg-card border border-border/40 overflow-hidden shadow-2xl flex flex-col h-[520px]">
      
      {/* Tab controls */}
      <div className="flex border-b border-border/40 bg-muted/30">
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'chat'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Live Chat</span>
        </button>
        <button
          onClick={() => setActiveSubTab('activity')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'activity'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Live Plays</span>
        </button>
      </div>

      {/* Main Feed area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0 bg-[#090610]/40">
        {activeSubTab === 'chat' ? (
          <>
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex gap-2.5 items-start text-xs hover:bg-muted/10 p-1.5 rounded-xl transition-colors">
                <img src={msg.avatar} alt="Avatar" className="w-7 h-7 rounded-lg object-cover bg-muted border border-border/20" suppressHydrationWarning />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`font-bold hover:underline cursor-pointer truncate ${msg.isVip ? 'text-primary' : 'text-foreground'}`}>
                      {msg.username}
                    </span>
                    {msg.isVip && (
                      <span className="px-1.5 py-0.2 bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary rounded-md uppercase tracking-wider">
                        VIP
                      </span>
                    )}
                    <span className="text-[9px] text-muted-foreground/50">{msg.time}</span>
                  </div>
                  <p className="text-muted-foreground/90 mt-0.5 leading-relaxed break-words">{msg.text}</p>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {activityPlays.map((play) => (
              <div key={play.id} className="p-3 rounded-xl border border-border/30 bg-muted/20 flex flex-col gap-1.5 transition-all hover:border-primary/20">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-primary" />
                    {play.username}
                  </span>
                  <span className="text-[9px] text-muted-foreground/60">{play.time}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Played <span className="text-foreground font-semibold">{play.gameName}</span></span>
                  <span className="text-primary font-bold text-[11px]">{play.score}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] border-t border-border/20 pt-1.5">
                  <span className="text-muted-foreground">Rewards won:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                    <Trophy className="h-3 w-3 fill-emerald-400" />
                    +{play.coins} COINS
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat bottom send input bar */}
      {activeSubTab === 'chat' && (
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border/40 bg-muted/10 flex gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            className="flex-1 h-9 px-3 rounded-xl bg-muted border border-border/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            className="h-9 w-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/95 transition-colors cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}

    </div>
  )
}
