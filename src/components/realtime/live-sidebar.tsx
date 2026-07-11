'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Activity, Send, Trophy, Flame, Smile, Zap, Crown, Star } from 'lucide-react'
import { sound } from '@/lib/sound'
import { useUser } from '@clerk/nextjs'

interface ChatMessage {
  id: string
  username: string
  avatar: string
  text: string
  time: string
  isVip?: boolean
  color?: string
}

interface ActivityPlay {
  id: string
  username: string
  gameName: string
  score: string
  coins: number
  time: string
}

// Assign a stable neon color to each username
const USERNAME_COLORS = [
  '#d946ef', '#06b6d4', '#eab308', '#22c55e',
  '#f97316', '#a855f7', '#ec4899', '#14b8a6',
  '#3b82f6', '#ef4444',
]
function getUserColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return USERNAME_COLORS[Math.abs(hash) % USERNAME_COLORS.length]
}

// Quick emoji reactions the user can pick
const QUICK_EMOJIS = ['🔥', '😂', '🎮', '⚡', '👑', '💎', '🚀', '😎']

export default function LiveSidebar() {
  const { user } = useUser()
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'activity'>('chat')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [activityPlays, setActivityPlays] = useState<ActivityPlay[]>([])
  const [typedMessage, setTypedMessage] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const [onlineCount, setOnlineCount] = useState(847)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fluctuate online count for realism
  useEffect(() => {
    const t = setInterval(() => {
      setOnlineCount(c => Math.max(600, c + Math.floor((Math.random() - 0.45) * 8)))
    }, 5000)
    return () => clearInterval(t)
  }, [])

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
          isVip: d.isVip,
          color: getUserColor(d.username)
        }))
        setChatMessages(formatted)
      }
    } catch (e) {
      console.error('Failed to load chat:', e)
    }
  }, [])

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

  useEffect(() => {
    fetchChat()
    fetchPlays()
  }, [fetchChat, fetchPlays])

  useEffect(() => {
    const chatTimer = setInterval(() => {
      if (activeSubTab === 'chat') fetchChat()
    }, 3000)
    const playsTimer = setInterval(() => {
      if (activeSubTab === 'activity') fetchPlays()
    }, 4000)
    return () => { clearInterval(chatTimer); clearInterval(playsTimer) }
  }, [activeSubTab, fetchChat, fetchPlays])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, activeSubTab])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedMessage.trim()) return

    const username = user?.username || user?.firstName || 'GuestPlayer'
    const avatar = user?.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40&auto=format&fit=crop'
    const payload = { room: 'global', username, avatarUrl: avatar, content: typedMessage.trim(), isVip: true }

    setTypedMessage('')
    setShowEmojis(false)
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

  const insertEmoji = (emoji: string) => {
    setTypedMessage(prev => prev + emoji)
    setShowEmojis(false)
    inputRef.current?.focus()
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[540px] border border-border/30"
      style={{ background: 'linear-gradient(180deg, #0d0d18 0%, #0a0a14 100%)' }}
    >
      {/* ── Header with online count ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5"
        style={{ background: 'linear-gradient(90deg, rgba(217,70,239,0.08) 0%, rgba(6,182,212,0.05) 100%)' }}
      >
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </div>
          <span className="text-[11px] font-extrabold text-white uppercase tracking-widest">Live Chat</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 tabular-nums">{onlineCount.toLocaleString()}</span>
          <span className="text-[9px] text-muted-foreground">online</span>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex border-b border-white/5">
        {(['chat', 'activity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-2.5 text-[11px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer relative ${
              activeSubTab === tab
                ? 'text-primary'
                : 'text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            {tab === 'chat' ? <MessageSquare className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
            {tab === 'chat' ? 'Chat' : 'Activity'}
            {activeSubTab === tab && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* ── Messages feed ── */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto flex flex-col gap-0.5 min-h-0 px-3 py-2 scrollbar-none"
      >
        {activeSubTab === 'chat' ? (
          chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40 select-none">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">No messages yet. Say something!</p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const color = msg.color || getUserColor(msg.username)
              const initials = msg.username.slice(0, 2).toUpperCase()
              return (
                <div
                  key={msg.id}
                  className="group flex gap-2.5 items-start py-1.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors duration-150"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 relative">
                    {msg.avatar && !msg.avatar.includes('unsplash') ? (
                      <img
                        src={msg.avatar}
                        alt={msg.username}
                        className="w-7 h-7 rounded-lg object-cover border-2"
                        style={{ borderColor: color + '66' }}
                        suppressHydrationWarning
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-extrabold text-black flex-shrink-0 border-2"
                        style={{ backgroundColor: color, borderColor: color + '44' }}
                      >
                        {initials}
                      </div>
                    )}
                    {/* Online dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0d0d18]" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span
                        className="text-[11px] font-extrabold cursor-pointer hover:underline"
                        style={{ color }}
                      >
                        {msg.username}
                      </span>
                      {msg.isVip && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[8px] font-extrabold uppercase tracking-wider"
                          style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}
                        >
                          <Crown className="h-2 w-2" />
                          VIP
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        {msg.time}
                      </span>
                    </div>
                    <p className="text-[12px] text-white/80 leading-relaxed break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              )
            })
          )
        ) : (
          /* ── Activity Feed ── */
          <div className="flex flex-col gap-2 py-1">
            {activityPlays.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40 select-none">
                <Activity className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              activityPlays.map((play) => (
                <div
                  key={play.id}
                  className="p-3 rounded-xl border border-white/5 bg-white/[0.03] flex flex-col gap-1.5 hover:border-primary/20 hover:bg-primary/[0.03] transition-all duration-200"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-orange-400" />
                      {play.username}
                    </span>
                    <span className="text-[9px] text-muted-foreground/40">{play.time}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground/70">
                      Played <span className="text-white font-bold">{play.gameName}</span>
                    </span>
                    <span className="text-primary font-extrabold">{play.score}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                    <span className="text-[9px] text-muted-foreground/50">Reward earned</span>
                    <span className="text-emerald-400 font-extrabold text-[10px] flex items-center gap-1">
                      <Trophy className="h-3 w-3 fill-emerald-400" />
                      +{play.coins} Coins
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Emoji Picker tray ── */}
      {activeSubTab === 'chat' && showEmojis && (
        <div className="px-3 pb-1 flex gap-1.5 flex-wrap border-t border-white/5 pt-2 bg-white/[0.02]">
          {QUICK_EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => insertEmoji(e)}
              className="text-base hover:scale-125 transition-transform active:scale-95 cursor-pointer"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Bar ── */}
      {activeSubTab === 'chat' && (
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-white/5 flex gap-2 items-center"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          {/* Emoji toggle */}
          <button
            type="button"
            onClick={() => setShowEmojis(v => !v)}
            className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              showEmojis
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 border border-white/10'
            }`}
          >
            <Smile className="h-4 w-4" />
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            placeholder="Send a message…"
            value={typedMessage}
            onChange={e => setTypedMessage(e.target.value)}
            maxLength={200}
            className="flex-1 h-9 px-3 rounded-xl text-[12px] text-white placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!typedMessage.trim()}
            className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: typedMessage.trim()
                ? 'linear-gradient(135deg, #d946ef, #a21caf)'
                : 'rgba(255,255,255,0.05)',
              boxShadow: typedMessage.trim() ? '0 0 12px rgba(217,70,239,0.4)' : 'none'
            }}
          >
            <Send className="h-3.5 w-3.5 text-white" />
          </button>
        </form>
      )}
    </div>
  )
}
