'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserButton, SignInButton, useUser } from '@clerk/nextjs'
import { useTheme } from '@/components/theme-provider'
import { Sun, Moon, Search, Gamepad2, Trophy, Compass, Sparkles, Menu, X, ArrowUpRight, Coins } from 'lucide-react'

export default function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [coins, setCoins] = useState(100)
  const [equippedBorder, setEquippedBorder] = useState('none')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  useEffect(() => {
    const checkCoins = () => {
      try {
        fetch('/api/user/profile')
          .then((res) => res.json())
          .then((data) => {
            if (data && typeof data.coins === 'number') {
              setCoins(data.coins)
              setEquippedBorder(data.equippedBorder || 'none')
              localStorage.setItem('arcadecore_coins', data.coins.toString())
              localStorage.setItem('arcadecore_equipped_border', data.equippedBorder || 'none')
            }
          })
          .catch(() => {})
      } catch {}
    }
    
    checkCoins()
    
    // Listen for storage changes across tabs & local custom triggers
    window.addEventListener('storage', checkCoins)
    window.addEventListener('arcadecore_coins_updated', checkCoins)
    window.addEventListener('arcadecore_border_equipped', checkCoins)
    
    return () => {
      window.removeEventListener('storage', checkCoins)
      window.removeEventListener('arcadecore_coins_updated', checkCoins)
      window.removeEventListener('arcadecore_border_equipped', checkCoins)
    }
  }, [isSignedIn])

  // Fetch search suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const delayDebounce = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          .then((res) => res.json())
          .then((data) => {
            setSuggestions(data.slice(0, 5))
          })
          .catch((err) => console.error(err))
      }, 200)
      return () => clearTimeout(delayDebounce)
    } else {
      setSuggestions([])
    }
  }, [searchQuery])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSuggestionClick = (slug: string) => {
    setSearchQuery('')
    setShowSuggestions(false)
    router.push(`/games/${slug}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40 backdrop-blur-md">
      
      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="absolute inset-x-0 top-0 z-50 h-16 bg-background/95 backdrop-blur-md px-4 flex items-center justify-between gap-3 border-b border-border/50 animate-in fade-in slide-in-from-top-4 duration-200">
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search games, categories..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                autoFocus
                className="w-full h-10 pl-10 pr-10 rounded-full bg-muted/80 border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSuggestions([])
                  }}
                  className="absolute right-3.5 top-2.5 p-1 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>
          <button
            onClick={() => {
              setMobileSearchOpen(false)
              setSearchQuery('')
            }}
            className="px-4 py-2 rounded-full border border-border bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-bold uppercase transition-colors"
          >
            Cancel
          </button>

          {/* Mobile Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-16 mt-2 p-2 rounded-xl bg-card border border-border shadow-2xl z-50 glass mx-4">
              <div className="text-xs font-semibold text-muted-foreground px-3 py-1.5 uppercase tracking-wider">
                Suggested Games
              </div>
              {suggestions.map((game) => (
                <button
                  key={game.id}
                  onClick={() => {
                    handleSuggestionClick(game.slug)
                    setMobileSearchOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 text-left text-sm font-medium transition-all group/item"
                >
                  <img
                    src={game.thumbnailUrl}
                    alt={game.title}
                    className="w-8 h-8 rounded bg-muted object-cover border border-border/40"
                  />
                  <div className="flex-1 truncate">
                    <span className="text-foreground group-hover/item:text-primary transition-colors">
                      {game.title}
                    </span>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-4">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-lg group-hover:scale-105 transition-transform duration-200">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-background">
                <Gamepad2 className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform duration-200" />
              </div>
            </div>
            <span className="hidden font-display text-xl font-black tracking-wider text-primary glow-primary sm:block">
              ARCADE<span className="text-secondary glow-secondary">CORE</span>
            </span>
          </Link>
        </div>

        {/* Middle: Search Bar (Desktop Only) */}
        <div className="hidden md:block relative flex-1 max-w-md mx-4 sm:mx-8">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative group">
              <input
                type="text"
                placeholder="Search games, categories..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-muted/60 border border-border/80 text-foreground text-sm placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all duration-200"
              />
              <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSuggestions([])
                  }}
                  className="absolute right-3.5 top-2.5 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Autocomplete Suggestions Box */}
          {showSuggestions && suggestions.length > 0 && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowSuggestions(false)} 
              />
              <div className="absolute left-0 right-0 mt-2 p-2 rounded-xl bg-card border border-border shadow-2xl z-50 glass">
                <div className="text-xs font-semibold text-muted-foreground px-3 py-1.5 uppercase tracking-wider">
                  Suggested Games
                </div>
                {suggestions.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleSuggestionClick(game.slug)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 text-left text-sm font-medium transition-all group/item"
                  >
                    <img
                      src={game.thumbnailUrl}
                      alt={game.title}
                      className="w-8 h-8 rounded bg-muted object-cover border border-border/40"
                    />
                    <div className="flex-1 truncate">
                      <span className="text-foreground group-hover/item:text-primary transition-colors">
                        {game.title}
                      </span>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Side: Navigation & User Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/leaderboard"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-muted text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trophy className="h-4 w-4 text-accent" />
            <span>Leaderboard</span>
          </Link>

          {isSignedIn && (
            <Link
              href="/shop"
              className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-emerald-400 text-xs font-black hover:bg-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              title="Coin Shop - Purchase & Spend Coins"
            >
              <Coins className="h-4 w-4 fill-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{coins} COINS</span>
            </Link>
          )}

          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden p-2 rounded-xl bg-muted/60 border border-border/60 hover:bg-muted hover:text-primary transition-all duration-200"
            aria-label="Search Games"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-muted/60 border border-border/60 hover:bg-muted hover:text-primary transition-all duration-200"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-accent animate-pulse" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
          </button>

          {/* Authentication Clerk Buttons */}
          <div className="flex items-center gap-2 border-l border-border/50 pl-3">
            {isSignedIn ? (() => {
              const borderStyles: { [key: string]: string } = {
                'none': 'border border-primary/40 p-[1px]',
                'cyber-green': 'border-2 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] p-[1.5px]',
                'outrun-pink': 'border-2 border-pink-500 animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.6)] p-[1.5px]',
                'gold-crown': 'border-3 border-yellow-500 animate-bounce shadow-[0_0_12px_rgba(234,179,8,0.8)] p-[2px]',
                'rainbow-shift': 'border-3 border-transparent bg-clip-border bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-yellow-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] p-[2px]'
              };
              return (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: `h-9 w-9 rounded-xl hover:scale-105 transition-transform ${borderStyles[equippedBorder] || borderStyles['none']}`,
                    },
                  }}
                />
              );
            })() : (
              <SignInButton mode="modal">
                <button className="h-9 px-4 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  Login
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
