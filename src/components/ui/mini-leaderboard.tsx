'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, Flame, Crown, TrendingUp } from 'lucide-react'

interface LeaderEntry {
  rank: number
  name: string
  score: number
  game: string
  color: string
}

const MOCK_LEADERS: LeaderEntry[] = [
  { rank: 1, name: 'NOVA_X',     score: 48200, game: 'Neon Race 3D',        color: '#ffcc00' },
  { rank: 2, name: 'VOID_ACE',   score: 39100, game: 'Grand Prix Hero 3D',  color: '#00ffcc' },
  { rank: 3, name: 'PREM_S',     score: 31600, game: 'Neon Architect',       color: '#ff00ff' },
  { rank: 4, name: 'SYNTH_9',    score: 27400, game: 'Spike Snake',          color: '#0088ff' },
  { rank: 5, name: 'STORM_7',    score: 22900, game: 'Neon Race 3D',        color: '#ff5500' },
]

const MEDAL = ['🥇', '🥈', '🥉']

export default function MiniLeaderboard() {
  const [leaders, setLeaders] = useState(MOCK_LEADERS)
  const [flash, setFlash] = useState<number | null>(null)

  // Simulate score updates
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * leaders.length)
      setLeaders(prev => prev.map((l, i) =>
        i === idx ? { ...l, score: l.score + Math.floor(Math.random() * 300 + 50) } : l
      ))
      setFlash(idx)
      setTimeout(() => setFlash(null), 600)
    }, 5000)
    return () => clearInterval(interval)
  }, [leaders])

  return (
    <div className="rounded-2xl bg-card border border-border/40 overflow-hidden shadow-lg">
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-border/30">
        <Crown className="h-4 w-4 text-amber-500" />
        <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest">Global Leaderboard</h3>
        <div className="ml-auto flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-500">LIVE</span>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border/20">
        {leaders.map((entry, i) => (
          <div
            key={entry.name}
            className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-300 ${
              flash === i ? 'bg-amber-500/10' : 'hover:bg-muted/30'
            }`}
          >
            <span className="text-sm w-5 text-center">
              {i < 3 ? MEDAL[i] : <span className="text-xs text-muted-foreground font-bold">{entry.rank}</span>}
            </span>
            <div
              className="h-6 w-6 rounded-lg flex items-center justify-center text-[9px] font-extrabold text-black flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            >
              {entry.name.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate" style={{ color: entry.color }}>
                {entry.name}
              </p>
              <p className="text-[9px] text-muted-foreground truncate">{entry.game}</p>
            </div>
            <div className={`text-xs font-extrabold tabular-nums transition-all ${flash === i ? 'text-amber-400 scale-110' : 'text-foreground'}`}>
              {entry.score.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-border/20">
        <Link href="/leaderboard" className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors">
          <Trophy className="h-3.5 w-3.5" />
          View Full Leaderboard
        </Link>
      </div>
    </div>
  )
}
