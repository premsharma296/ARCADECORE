'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Star, ThumbsUp, ThumbsDown, Share2, Clipboard, Heart, Calendar, User, Info, Keyboard, HelpCircle, Lightbulb } from 'lucide-react'

interface GameMetadataPanelProps {
  game: {
    title: string
    description: string
    instructions?: string | null
    controls?: string | null
    rating: number
    playCount: number
    releaseDate?: Date | string
    developer?: { name: string } | null
    tags?: { name: string; slug: string }[]
  }
}

export default function GameMetadataPanel({ game }: GameMetadataPanelProps) {
  const [likes, setLikes] = useState(Math.floor(game.playCount * 0.08))
  const [dislikes, setDislikes] = useState(Math.floor(game.playCount * 0.003))
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'controls' | 'faq' | 'tips'>('walkthrough')

  const handleLike = () => {
    if (userRating === 'like') {
      setUserRating(null)
      setLikes(prev => prev - 1)
    } else {
      if (userRating === 'dislike') {
        setDislikes(prev => prev - 1)
      }
      setUserRating('like')
      setLikes(prev => prev + 1)
    }
  }

  const handleDislike = () => {
    if (userRating === 'dislike') {
      setUserRating(null)
      setDislikes(prev => prev - 1)
    } else {
      if (userRating === 'like') {
        setLikes(prev => prev - 1)
      }
      setUserRating('dislike')
      setDislikes(prev => prev + 1)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const formattedPlays = game.playCount.toLocaleString()

  return (
    <div className="flex flex-col gap-6 p-6 rounded-2xl glass border border-border/40">
      
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-black font-display tracking-wider text-foreground">
            {game.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="font-semibold text-secondary">{formattedPlays} plays</span>
            <span>&bull;</span>
            <div className="flex items-center gap-1 font-bold text-accent">
              <Star className="h-3.5 w-3.5 fill-accent stroke-accent" />
              <span>{game.rating.toFixed(1)} Rating</span>
            </div>
          </div>
        </div>

        {/* Action button triggers */}
        <div className="flex items-center gap-2">
          {/* Like button */}
          <button
            onClick={handleLike}
            className={`h-9 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              userRating === 'like'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 glow-emerald'
                : 'bg-muted/60 text-muted-foreground border-border/40 hover:text-foreground'
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{likes}</span>
          </button>

          {/* Dislike button */}
          <button
            onClick={handleDislike}
            className={`h-9 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              userRating === 'dislike'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-muted/60 text-muted-foreground border-border/40 hover:text-foreground'
            }`}
          >
            <ThumbsDown className="h-4 w-4" />
            <span>{dislikes}</span>
          </button>

          {/* Favorite button */}
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isFavorited
                ? 'bg-pink-500/15 text-pink-500 border-pink-500/30'
                : 'bg-muted/60 text-muted-foreground border-border/40 hover:text-foreground'
            }`}
            title="Favorite game"
          >
            <Heart className={`h-4.5 w-4.5 ${isFavorited ? 'fill-pink-500' : ''}`} />
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="h-9 px-3.5 rounded-xl bg-primary text-white border border-primary/20 text-xs font-bold flex items-center gap-1.5 hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            {copied ? (
              <>
                <Clipboard className="h-4 w-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Description block */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
          Description
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {game.description}
        </p>
      </div>

      {/* SEO Tabs Navigation */}
      <div className="flex flex-col gap-4 pt-2 border-t border-border/45">
        <div className="flex flex-wrap gap-2 border-b border-border/40 pb-2">
          <button
            onClick={() => setActiveTab('walkthrough')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'walkthrough'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Info className="h-4 w-4" />
            <span>Walkthrough &amp; Guide</span>
          </button>
          
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'controls'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Keyboard className="h-4 w-4" />
            <span>Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>FAQ Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('tips')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'tips'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Lightbulb className="h-4 w-4" />
            <span>Strategy Tips</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[140px] p-5 rounded-2xl bg-muted/20 border border-border/30 animate-fade-in animate-duration-200">
          {activeTab === 'walkthrough' && (
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-black uppercase text-foreground tracking-widest border-b border-border/40 pb-1.5">
                How to Play {game.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                {game.instructions || 'No instructions provided. Use the controls tab to learn how to guide your player.'}
              </p>
              <p className="text-[11px] text-muted-foreground/60 italic leading-relaxed mt-2 border-t border-border/20 pt-2">
                ArcadeCore Walkthrough Tip: Stay close to the center lane or platforms to avoid sudden shifts. Keep your fingers ready on navigation buttons!
              </p>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-black uppercase text-foreground tracking-widest border-b border-border/40 pb-1.5">
                Game Controller Configurations
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                {game.controls || 'Desktop: Use WASD/Arrow keys to navigate. Mobile: Use on-screen touch buttons.'}
              </p>
              <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground/50 border-t border-border/20 pt-2">
                <Keyboard className="h-4 w-4" />
                <span>Responsive configurations automatically apply to keyboard keys and mobile touchpads.</span>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-black uppercase text-foreground tracking-widest border-b border-border/40 pb-1.5">
                Frequently Asked Questions (FAQ)
              </h4>
              
              <div className="flex flex-col gap-2">
                <h5 className="text-xs font-bold text-foreground">Is {game.title} free to play online?</h5>
                <p className="text-xs text-muted-foreground">Yes! {game.title} is 100% free to play directly in your browser on ArcadeCore. No installations, setup, or downloads are required.</p>
              </div>

              <div className="flex flex-col gap-2 border-t border-border/20 pt-2.5">
                <h5 className="text-xs font-bold text-foreground">Can I play {game.title} on mobile and tablets?</h5>
                <p className="text-xs text-muted-foreground">Absolutely. ArcadeCore is built mobile-first. You can load this game on any iPhone, iPad, or Android browser and play with virtual touch controls.</p>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-black uppercase text-foreground tracking-widest border-b border-border/40 pb-1.5">
                High Score Strategies &amp; Secrets
              </h4>
              <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <li><strong>Multiplier Stacking</strong>: Keep your combos chain going! Don&apos;t pause or wait between actions to stack high multipliers.</li>
                <li><strong>Energy Battery Boosts</strong>: Keep an eye out for glowing yellow items to fill your sprint gauges.</li>
                <li><strong>Practice Mode</strong>: Play the initial stages slower to get a feel of the physics boundaries before trying high speeds.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Developers & internal tagging links */}
      <div className="flex flex-col gap-4 pt-4 border-t border-border/40 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-1.5 font-medium">
            <User className="h-4 w-4 text-primary" />
            <span>
              Developer:{' '}
              <Link
                href={`/developers/${game.developer?.name.toLowerCase().replace(/ /g, '-') || 'arcadecore-studios'}`}
                className="text-foreground hover:text-primary font-semibold transition-colors ml-0.5"
              >
                {game.developer?.name || 'ArcadeCore Studios'}
              </Link>
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="h-4 w-4 text-secondary" />
            <span>Released: <span className="text-foreground font-semibold">2026-07-05</span></span>
          </div>
        </div>

        {game.tags && game.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-foreground uppercase tracking-wider text-[10px] mr-1.5">Tags:</span>
            {game.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/tags/${tag.slug}`}
                className="px-2.5 py-1 text-[10px] font-semibold bg-muted hover:bg-muted/80 text-foreground uppercase tracking-wider rounded-lg border border-border/40 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
