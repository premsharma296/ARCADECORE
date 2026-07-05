'use client'

import React, { useState, useEffect, useRef } from 'react'
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

const CHAT_BOT_NAMES = ['NeonDiver', 'GamerPro', 'TetrisQueen', 'CyberNinja', 'PixelLord', 'RetroKid', 'OutrunRacer', 'BitCoiner', 'SpaceCadet', 'DogeMaster']
const CHAT_BOT_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=40&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=40&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=40&auto=format&fit=crop'
]

const CHAT_BOT_PHRASES = [
  'Who wants to challenge me in Cosmic Tetris?',
  'Just hit 4,200 points on Neon Velocity! 🏎️💨',
  'Weekly missions are kinda hard today, anyone completed the daily spin?',
  'This background music loop is an absolute vibe! 🔊⚡',
  'Crypto Clicker is addictive, my finger is sore lmao',
  'Let\'s gooo just unlocked the Jackpot badge! 🏆',
  'Flappy Cyber physics are so tight, love the thruster sparks.',
  'Anyone active for multiplayer matchmaking later?',
  'OMG Space Invaders retro waves are intense'
]

const GAMES_LIST = ['Neon Velocity', 'Cosmic Tetris', 'Flappy Cyber', 'Space Invaders Retro', 'Crypto Clicker']

export default function LiveSidebar() {
  const { user } = useUser()
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'activity'>('chat')
  
  // Chat feed
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      username: 'NeonDiver',
      avatar: CHAT_BOT_AVATARS[0],
      text: 'Welcome to ArcadeCore live chat! 🔥',
      time: '1m ago',
      isVip: true
    },
    {
      id: '2',
      username: 'TetrisQueen',
      avatar: CHAT_BOT_AVATARS[1],
      text: 'Just cleared 4 rows simultaneously in Cosmic Tetris! Let\'s go!',
      time: '30s ago'
    }
  ])
  const [typedMessage, setTypedMessage] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Live Activity
  const [activityPlays, setActivityPlays] = useState<ActivityPlay[]>([
    {
      id: '1',
      username: 'SpaceCadet',
      gameName: 'Space Invaders Retro',
      score: '1,480 pts',
      coins: 45,
      time: 'Just now'
    },
    {
      id: '2',
      username: 'BitCoiner',
      gameName: 'Crypto Clicker',
      score: '52,900 coins',
      coins: 120,
      time: '3s ago'
    }
  ])

  // Scroll Chat to Bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, activeSubTab])

  // Simulated Chat Loops (every 5-9 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeSubTab !== 'chat') return
      
      const botName = CHAT_BOT_NAMES[Math.floor(Math.random() * CHAT_BOT_NAMES.length)]
      const avatar = CHAT_BOT_AVATARS[Math.floor(Math.random() * CHAT_BOT_AVATARS.length)]
      const text = CHAT_BOT_PHRASES[Math.floor(Math.random() * CHAT_BOT_PHRASES.length)]

      setChatMessages((prev) => [
        ...prev.slice(-25), // keep last 25
        {
          id: Date.now().toString(),
          username: botName,
          avatar: avatar,
          text: text,
          time: 'Just now',
          isVip: Math.random() < 0.2
        }
      ])
      
      // Play soft tick sound when messages arrive
      sound.playTick()
    }, 6000)

    return () => clearInterval(interval)
  }, [activeSubTab])

  // Simulated Plays Ticker (every 2-4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const botName = CHAT_BOT_NAMES[Math.floor(Math.random() * CHAT_BOT_NAMES.length)]
      const game = GAMES_LIST[Math.floor(Math.random() * GAMES_LIST.length)]
      const coinsWon = Math.floor(Math.random() * 85) + 15
      
      let scoreStr = `${Math.floor(Math.random() * 2500) + 100} pts`
      if (game === 'Crypto Clicker') scoreStr = `${(Math.random() * 25 + 1).toFixed(1)}K clicks`

      setActivityPlays((prev) => [
        {
          id: Date.now().toString(),
          username: botName,
          gameName: game,
          score: scoreStr,
          coins: coinsWon,
          time: 'Just now'
        },
        ...prev.slice(0, 15) // Keep last 15
      ])
    }, 3200)

    return () => clearInterval(interval)
  }, [])

  // User message submit handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedMessage.trim()) return

    const username = user?.username || user?.emailAddresses[0]?.emailAddress.split('@')[0] || 'GuestPlayer'
    const avatar = user?.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40&auto=format&fit=crop'

    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        username,
        avatar,
        text: typedMessage,
        time: 'Just now',
        isVip: true
      }
    ])
    
    setTypedMessage('')
    sound.playClick()
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
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0 bg-[#090610]/40">
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
            <div ref={chatEndRef} />
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
