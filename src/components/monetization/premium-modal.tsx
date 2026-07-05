'use client'

import React, { useState } from 'react'
import { X, Sparkles, CreditCard, ShieldCheck, CheckCircle2, Loader2, Star } from 'lucide-react'
import sound from '@/lib/sound'
import confetti from 'canvas-confetti'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PremiumModal({ isOpen, onClose, onSuccess }: PremiumModalProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Card input states
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    sound.playClick()

    // Simulate Stripe payment processing time
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      
      // Trigger leveling up win sounds and beautiful celebration confetti!
      sound.playWin()
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#d946ef', '#06b6d4', '#eab308']
      })
    }, 2500)
  }

  const handleFinishSuccess = () => {
    onSuccess()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dim overlay background */}
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-md" />

      {/* Modal Main box */}
      <div className="relative w-full max-w-md p-6 rounded-2xl glass border border-primary/20 bg-[#12121a]/90 shadow-2xl z-50 overflow-hidden select-none">
        
        {/* Glow corner decorations */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        {/* Close button */}
        {!success && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        )}

        {success ? (
          // SUCCESS STATE SCREEN
          <div className="flex flex-col items-center justify-center text-center py-6 gap-5">
            <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary animate-pulse">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            
            <div>
              <h3 className="text-2xl font-black font-display tracking-wider text-foreground">
                MEMBERSHIP UNLOCKED!
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Welcome to ArcadeCore Pro. All sidebar, header, and interstitial advertisements are now disabled on your account!
              </p>
            </div>

            <div className="w-full flex items-center justify-center gap-1.5 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-accent">
              <Star className="h-4 w-4 fill-accent animate-spin" />
              <span>Enjoy 2x XP Multiplier on all actions!</span>
            </div>

            <button
              onClick={handleFinishSuccess}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm tracking-wide uppercase transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] cursor-pointer"
            >
              Start Playing
            </button>
          </div>
        ) : (
          // CARD CHECKOUT GATEWAY STATE
          <form onSubmit={handleCheckout} className="flex flex-col gap-6">
            
            {/* Title branding */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-primary/20 mb-2">
                <Sparkles className="h-3 w-3" />
                <span>ArcadeCore Pro</span>
              </div>
              <h3 className="text-xl font-black font-display tracking-wider text-foreground">
                ARCADE<span className="text-secondary">CORE</span> PRO
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Disable all banner and popup video ads instantly for $2.99 / mo.
              </p>
            </div>

            {/* Simulated stripe card fields */}
            <div className="flex flex-col gap-4">
              {/* Card name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              {/* Card number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                  <CreditCard className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/60" />
                </div>
              </div>

              {/* Expiry & CVC grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Exp date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Expiration Date
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                {/* CVC */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    CVC Code
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="***"
                    maxLength={3}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Bottom trust footer */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 bg-white/5 p-3 rounded-xl border border-white/5">
              <ShieldCheck className="h-4.5 w-4.5 text-secondary" />
              <span>Secured by Stripe SSL. Cancel subscription anytime.</span>
            </div>

            {/* Checkout button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 disabled:opacity-50 text-white font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Authorizing Checkout...</span>
                </>
              ) : (
                <span>Authorize & Pay $2.99</span>
              )}
            </button>

          </form>
        )}

      </div>
    </div>
  )
}
