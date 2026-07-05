'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Gamepad2, Sword, Compass, Car, Target, Trophy, Brain, Clock, Cpu, 
  Users, Globe, GraduationCap, Smile, Grid3X3, Layers, Home, PuzzleIcon,
  ShieldAlert, Settings, HelpCircle, Gift, Sparkles, ShoppingBag
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'

// Simple icon map matching string back to Lucide components
export const iconMap: { [key: string]: React.ComponentType<any> } = {
  Home: Home,
  Gamepad2: Gamepad2,
  Sword: Sword,
  Compass: Compass,
  Puzzle: PuzzleIcon,
  Car: Car,
  Target: Target,
  Trophy: Trophy,
  Brain: Brain,
  Clock: Clock,
  Cpu: Cpu,
  Users: Users,
  Globe: Globe,
  GraduationCap: GraduationCap,
  Smile: Smile,
  Grid3X3: Grid3X3,
  Layers: Layers,
}

const CATEGORIES = [
  { name: 'Action', slug: 'action', icon: 'Sword' },
  { name: 'Adventure', slug: 'adventure', icon: 'Compass' },
  { name: 'Arcade', slug: 'arcade', icon: 'Gamepad2' },
  { name: 'Puzzle', slug: 'puzzle', icon: 'Puzzle' },
  { name: 'Racing', slug: 'racing', icon: 'Car' },
  { name: 'Shooting', slug: 'shooting', icon: 'Target' },
  { name: 'Sports', slug: 'sports', icon: 'Trophy' },
  { name: 'Strategy', slug: 'strategy', icon: 'Brain' },
  { name: 'Idle', slug: 'idle', icon: 'Clock' },
  { name: 'Simulation', slug: 'simulation', icon: 'Cpu' },
  { name: 'Multiplayer', slug: 'multiplayer', icon: 'Users' },
  { name: 'IO Games', slug: 'io-games', icon: 'Globe' },
  { name: 'Educational', slug: 'educational', icon: 'GraduationCap' },
  { name: 'Kids', slug: 'kids', icon: 'Smile' },
  { name: 'Board Games', slug: 'board-games', icon: 'Grid3X3' },
  { name: 'Card Games', slug: 'card-games', icon: 'Layers' },
]

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { user } = useUser()
  
  // Simulated Admin check (Clerk email matching or role verification)
  const isAdmin = user?.emailAddresses.some(
    e => e.emailAddress.startsWith('admin') || 
         e.emailAddress === 'premchandsharma@gmail.com' || 
         e.emailAddress === 'itzpremsharma01@gmail.com'
  )

  const renderLink = (href: string, label: string, Icon: React.ComponentType<any>, colorClass = 'text-muted-foreground') => {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        onClick={onClose}
        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] ${
          isActive 
            ? 'bg-primary/10 text-primary border-l-2 border-primary pl-2.5' 
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-primary' : colorClass}`} />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <aside
      className={`fixed top-16 bottom-0 left-0 z-40 w-64 glass border-r border-border/40 transform transition-transform duration-300 lg:translate-x-0 overflow-y-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col gap-6 p-4">
        
        {/* Navigation Core */}
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-semibold text-muted-foreground/60 px-3 uppercase tracking-wider mb-1">
            Discover
          </div>
          {renderLink('/', 'Home', Home, 'text-primary')}
          {renderLink('/leaderboard', 'Leaderboard', Trophy, 'text-accent')}
          {renderLink('/missions', 'Weekly Quests', Sparkles, 'text-primary')}
          {renderLink('/shop', 'Coin Shop', ShoppingBag, 'text-emerald-400')}
          
          <Link
            href="/rewards"
            onClick={onClose}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] text-muted-foreground hover:bg-muted hover:text-foreground`}
          >
            <div className="flex items-center gap-3">
              <Gift className="h-4.5 w-4.5 text-secondary" />
              <span>Daily Rewards</span>
            </div>
            <span className="flex h-2 w-2 rounded-full bg-secondary animate-ping" />
          </Link>

          {/* Daily Streak Retention Widget */}
          <div className="mx-2.5 mt-2.5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold text-orange-400 uppercase tracking-widest">Streak Active</span>
              <span className="text-[10px] font-semibold text-muted-foreground/80 mt-0.5">3 Days (1.2x XP Boost)</span>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-semibold text-muted-foreground/60 px-3 uppercase tracking-wider mb-1">
            Categories
          </div>
          <div className="flex flex-col gap-1">
            {CATEGORIES.map((cat) => {
              const Icon = iconMap[cat.icon] || Gamepad2
              const catHref = `/categories/${cat.slug}`
              const isActive = pathname === catHref
              return (
                <Link
                  key={cat.slug}
                  href={catHref}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-secondary/15 text-secondary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-secondary' : 'text-muted-foreground'}`} />
                  <span>{cat.name}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Admin Dashboard Access */}
        {isAdmin && (
          <div className="flex flex-col gap-1.5 mt-2 pt-4 border-t border-border/40">
            <div className="text-xs font-semibold text-red-500/80 px-3 uppercase tracking-wider mb-1">
              Admin Portal
            </div>
            {renderLink('/admin', 'Control Center', ShieldAlert, 'text-red-500')}
          </div>
        )}

        {/* Footer info in sidebar */}
        <div className="mt-auto px-3 py-4 text-center">
          <div className="text-xs text-muted-foreground/50 flex items-center justify-center gap-1 font-medium">
            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            <span>ArcadeCore v1.0</span>
          </div>
        </div>

      </div>
    </aside>
  )
}
