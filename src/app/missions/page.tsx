'use client'

import React, { useState, useEffect } from 'react'
import AppShell from '@/components/layout/app-shell'
import { Sparkles, Trophy, CheckCircle2, Clock, Award, ShieldAlert } from 'lucide-react'
import sound from '@/lib/sound'
import confetti from 'canvas-confetti'

interface Mission {
  id: string
  title: string
  desc: string
  rewardXp: number
  target: number
  current: number
  claimed: boolean
  category: string
}

export default function MissionsPage() {
  const [mounted, setMounted] = useState(false)
  const [streakDays, setStreakDays] = useState(3)
  const [missions, setMissions] = useState<Mission[]>([])

  useEffect(() => {
    fetch('/api/user/quests')
      .then((res) => res.json())
      .then((data) => {
        setMissions(data)
        setMounted(true)
      })
      .catch(() => {
        setMounted(true)
      })
  }, [])

  const claimXp = (id: string, rewardXp: number) => {
    sound.playClick()
    
    fetch('/api/user/quests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questId: id })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMissions((prev) =>
            prev.map((m) => (m.id === id ? { ...m, claimed: true } : m))
          )
          sound.playWin()
          confetti({
            particleCount: 100,
            spread: 60,
            colors: ['#d946ef', '#06b6d4']
          })
          window.dispatchEvent(new Event('arcadecore_coins_updated'))
        } else {
          alert(data.error || 'Failed to claim reward')
        }
      })
      .catch(() => {
        alert('Network error claiming reward')
      })
  }

  if (!mounted) {
    return (
      <AppShell>
        <div className="w-full h-96 bg-muted/20 rounded-3xl animate-pulse" />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto flex flex-col gap-8 w-full my-2">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-display tracking-wider uppercase text-foreground">
                Weekly Quests & Streaks
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete quests to earn massive XP multipliers and level up your ranking profile.
              </p>
            </div>
          </div>

          {/* Daily Streak Indicator */}
          <div className="flex items-center gap-3 glass border border-orange-500/20 px-4 py-2 rounded-2xl bg-orange-500/5 select-none animate-pulse">
            <span className="flex h-3 w-3 rounded-full bg-orange-500" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Active Streak</span>
              <span className="text-xs font-black text-foreground">{streakDays} Days (1.2x XP Boost!)</span>
            </div>
          </div>
        </div>

        {/* Missions Grid */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Active Quests</h3>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Resets in 4 days</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {missions.map((mission) => {
              const isCompleted = mission.current >= mission.target
              const progressPercent = Math.min((mission.current / mission.target) * 100, 100)

              return (
                <div
                  key={mission.id}
                  className={`p-5 rounded-2xl glass border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 ${
                    mission.claimed
                      ? 'border-border/20 bg-muted/10 opacity-60'
                      : isCompleted
                      ? 'border-emerald-500/30 bg-emerald-500/5 shadow-md shadow-emerald-500/5'
                      : 'border-border/40 hover:border-primary/20'
                  }`}
                >
                  {/* Left Column: Details */}
                  <div className="flex-1 flex gap-4 items-start">
                    <div className={`p-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider ${
                      isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-muted border-border/40 text-muted-foreground'
                    }`}>
                      {mission.category}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-foreground">{mission.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mission.desc}</p>
                      
                      {/* Progress Line */}
                      <div className="flex items-center gap-3 mt-3.5 max-w-sm">
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isCompleted ? 'bg-emerald-400' : 'bg-primary'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {mission.current} / {mission.target}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Claim actions */}
                  <div className="flex items-center gap-4 self-end md:self-center">
                    <div className="flex flex-col gap-0.5 text-right">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reward</span>
                      <span className="text-sm font-black text-primary font-display">+{mission.rewardXp} XP</span>
                    </div>

                    {mission.claimed ? (
                      <button
                        disabled
                        className="h-10 px-5 rounded-xl bg-muted text-muted-foreground/60 border border-border/40 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                      >
                        Claimed
                      </button>
                    ) : isCompleted ? (
                      <button
                        onClick={() => claimXp(mission.id, mission.rewardXp)}
                        className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-450 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-transform hover:scale-[1.02] cursor-pointer animate-pulse"
                      >
                        <span>Claim Reward</span>
                        <Award className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="h-10 px-5 rounded-xl bg-muted/60 text-muted-foreground/40 border border-border/40 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                      >
                        In Progress
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
