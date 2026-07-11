'use client'

import React from 'react'
import Link from 'next/link'
import { Flame, Users, Clock, ShieldAlert, Sparkles, Trophy } from 'lucide-react'

interface VibeCard {
  title: string
  desc: string
  emoji: string
  color: string
  shadow: string
  link: string
  icon: React.ComponentType<{ className?: string }>
}

export default function VibeCategories() {
  const vibes: VibeCard[] = [
    {
      title: 'Adrenaline Rush',
      desc: 'Action & Speed',
      emoji: '🏎️',
      color: 'from-pink-600/20 to-purple-600/10 border-pink-500/30 text-pink-400',
      shadow: 'hover:shadow-pink-500/10',
      link: '/categories/racing',
      icon: Flame
    },
    {
      title: 'With Friends',
      desc: 'Multiplayer MMO',
      emoji: '🙌',
      color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30 text-emerald-400',
      shadow: 'hover:shadow-emerald-500/10',
      link: '/categories/multiplayer',
      icon: Users
    },
    {
      title: '5-Minute Fun',
      desc: 'Quick Arcade Play',
      emoji: '☕',
      color: 'from-amber-600/20 to-orange-600/10 border-amber-500/30 text-amber-400',
      shadow: 'hover:shadow-amber-500/10',
      link: '/categories/arcade',
      icon: Clock
    },
    {
      title: 'Sci-Fi & Cyber',
      desc: 'WebGL 3D Worlds',
      emoji: '🛸',
      color: 'from-blue-600/20 to-indigo-600/10 border-blue-500/30 text-blue-400',
      shadow: 'hover:shadow-blue-500/10',
      link: '/tags/webgl',
      icon: Sparkles
    },
    {
      title: 'Retro Classics',
      desc: 'Pixel Art Styles',
      emoji: '👾',
      color: 'from-violet-600/20 to-fuchsia-600/10 border-violet-500/30 text-violet-400',
      shadow: 'hover:shadow-violet-500/10',
      link: '/tags/retro',
      icon: Trophy
    },
    {
      title: 'Deep Strategy',
      desc: 'Core Management',
      emoji: '🧠',
      color: 'from-cyan-600/20 to-blue-600/10 border-cyan-500/30 text-cyan-400',
      shadow: 'hover:shadow-cyan-500/10',
      link: '/categories/strategy',
      icon: ShieldAlert
    }
  ]

  return (
    <div className="w-full">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x select-none">
        {vibes.map((v) => (
          <Link
            key={v.title}
            href={v.link}
            className={`flex-shrink-0 snap-start w-[185px] p-4 rounded-2xl bg-gradient-to-br ${v.color} border backdrop-blur-sm flex flex-col justify-between h-[105px] hover:scale-[1.03] transition-all duration-300 shadow-md ${v.shadow} hover:shadow-lg hover:border-current/40 group`}
          >
            <div className="flex justify-between items-start">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{v.emoji}</span>
              <v.icon className="h-4 w-4 opacity-40 group-hover:opacity-85 transition-opacity" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="font-extrabold text-xs tracking-wider uppercase text-white truncate">
                {v.title}
              </h4>
              <p className="text-[10px] text-muted-foreground truncate">
                {v.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
