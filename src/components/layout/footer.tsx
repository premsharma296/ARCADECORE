'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Gamepad2, Send, Heart, Mail, Shield, CheckCircle } from 'lucide-react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 5000)
    }
  }

  return (
    <footer className="w-full glass border-t border-border/40 mt-auto bg-background/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Logo & About */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 group w-max">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-secondary p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-background">
                  <Gamepad2 className="h-4 w-4 text-primary" />
                </div>
              </div>
              <span className="font-display text-lg font-black tracking-wider text-primary glow-primary">
                ARCADE<span className="text-secondary glow-secondary">CORE</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              ArcadeCore is the ultimate browser gaming hub, home to hundreds of instant HTML5, WebGL, and mobile-friendly games. Play instantly, level up, and conquer rankings!
            </p>
          </div>

          {/* Categories Links column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Popular Links</h3>
            <ul className="flex flex-col gap-2.5">
              {['Racing', 'Shooting', 'Puzzle', 'Action', 'Sports'].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/categories/${cat.toLowerCase()}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    {cat} Games
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Pages Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Support & Legal</h3>
            <ul className="flex flex-col gap-2.5">
              {['About Us', 'Privacy Policy', 'Terms of Service', 'Developer Portal', 'Leaderboard'].map((item) => (
                <li key={item}>
                  <Link
                    href={item === 'Leaderboard' ? '/leaderboard' : '/'}
                    className="text-sm text-muted-foreground hover:text-secondary transition-colors font-medium"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Join Newsletter</h3>
            <p className="text-sm text-muted-foreground/80">
              Get notified of the latest game drops, seasonal event updates, and leaderboard drops.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 rounded-xl bg-muted/80 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
                <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/60" />
              </div>
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-primary/10"
              >
                {subscribed ? <CheckCircle className="h-4.5 w-4.5 text-white animate-bounce" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>

        </div>

        {/* Bottom copyright section */}
        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/70">
            &copy; {new Date().getFullYear()} ArcadeCore. All rights reserved. Sourced from open open-source gaming projects.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-primary fill-primary animate-pulse" />
            <span>for browsers worldwide</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
