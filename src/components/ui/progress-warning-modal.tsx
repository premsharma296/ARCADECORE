'use client'

import React from 'react'
import { SignInButton } from '@clerk/nextjs'
import { X, AlertTriangle, Coins, Trophy, Sparkles, Gamepad2 } from 'lucide-react'
import { sound } from '@/lib/sound'

interface ProgressWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onContinueAsGuest: () => void
}

export default function ProgressWarningModal({ isOpen, onClose, onContinueAsGuest }: ProgressWarningModalProps) {
  if (!isOpen) return null

  const handleContinue = () => {
    sound.playClick()
    onContinueAsGuest()
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Dim backdrop overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-md" />

      {/* Modal Content Box */}
      <div className="relative w-full max-w-md p-6 rounded-2xl glass border border-amber-500/20 bg-[#12121a]/95 shadow-[0_0_30px_rgba(234,179,8,0.15)] z-50 overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow corner decorations */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Warning Branding & Content */}
        <div className="flex flex-col gap-6">
          <div className="text-center">
            {/* Pulsing Warning Icon */}
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-3.5 animate-pulse">
              <AlertTriangle className="h-7 w-7" />
            </div>
            
            <h3 className="text-xl font-black font-display tracking-wider text-foreground uppercase">
              Progress Won't Be Saved!
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              You are playing in <span className="text-amber-500 font-bold">Guest Mode</span>. Connect your account to save highscores, earn coins, and sync your gameplay.
            </p>
          </div>

          {/* Perks Comparison / List */}
          <div className="flex flex-col gap-3.5">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 border-b border-border/30 pb-1.5">
              Why create a free account?
            </div>
            
            <div className="flex flex-col gap-3">
              {/* Perk 1 */}
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Coins className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-foreground">Earn Spendable Coins</h4>
                  <p className="text-[11px] text-muted-foreground">Unlock exclusive profile borders, custom tags, and avatars at the shop.</p>
                </div>
              </div>

              {/* Perk 2 */}
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Trophy className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-foreground">Climb Global Leaderboards</h4>
                  <p className="text-[11px] text-muted-foreground">Submit high scores and claim bragging rights against top players.</p>
                </div>
              </div>

              {/* Perk 3 */}
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-foreground">Level-Up & Missions</h4>
                  <p className="text-[11px] text-muted-foreground">Gain XP, track streaks, and complete weekly quests to boost your profile.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col gap-2.5 mt-2">
            <SignInButton mode="modal">
              <button
                onClick={() => sound.playClick()}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-primary/25 cursor-pointer"
              >
                <Gamepad2 className="h-4 w-4" />
                Create Free Account
              </button>
            </SignInButton>

            <button
              onClick={handleContinue}
              className="w-full h-10 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-wider transition-all border border-border/40 hover:scale-[1.01] cursor-pointer"
            >
              Continue as Guest (Don't Save)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
