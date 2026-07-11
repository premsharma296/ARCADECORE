'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Flame, Zap, Trophy, Users, Sparkles } from 'lucide-react'

const TICKER_ITEMS = [
  { icon: '🔥', text: '2,847 players online right now' },
  { icon: '⚡', text: 'TOURNAMENT: Grand Prix Hero 3D — Prize: 5,000 Coins' },
  { icon: '🏆', text: 'New leaderboard season started! Climb the ranks!' },
  { icon: '🎮', text: 'New game dropping this week — Mech Wars: Uprising' },
  { icon: '💎', text: 'Daily Reward available — Spin to win 200+ Coins!' },
  { icon: '🚀', text: 'Neon Architect: 189 architects building right now' },
  { icon: '⭐', text: 'Spike Snake has a new multiplayer arena update!' },
  { icon: '🎯', text: 'Top player NOVA_X scored 48,200 in Neon Race 3D' },
  { icon: '🌐', text: 'ArcadeCore now has 50,000+ registered architects' },
  { icon: '🛒', text: 'FLASH SALE: Purple Flame avatar border — 30% off today!' },
]

export default function LiveTickerBar() {
  const tickerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="w-full bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-b border-border/30 overflow-hidden relative select-none">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="flex items-center gap-0 py-1.5 overflow-hidden">
        {/* LIVE label */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 border-r border-border/30 mr-4">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest">Live</span>
        </div>

        {/* Scrolling ticker text */}
        <div
          ref={tickerRef}
          className="flex gap-12 animate-ticker whitespace-nowrap"
          style={{ animationDuration: '35s' }}
        >
          {/* Double the items to create seamless loop */}
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
              <span>{item.icon}</span>
              <span>{item.text}</span>
              <span className="text-border/60 ml-8">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
