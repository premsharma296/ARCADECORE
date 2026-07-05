'use client'

import React, { useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { Send, MessageSquare, ShieldAlert } from 'lucide-react'

export default function GameCommentsPanel({ gameId }: { gameId: string }) {
  const { isSignedIn, user } = useUser()
  const [commentText, setCommentText] = useState('')
  
  // High-quality mock starting reviews
  const [comments, setComments] = useState<any[]>([
    {
      id: '1',
      username: 'ShadowRider',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40&auto=format&fit=crop',
      content: 'This game is absolutely insane! The soundtrack alone is worth 10 stars. Anyone beat my score of 24,000?',
      createdAt: '3 hours ago',
    },
    {
      id: '2',
      username: 'PixelChallenger',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=40&auto=format&fit=crop',
      content: 'Super smooth controls on mobile. Really fun micro-arcade game. Highly recommended.',
      createdAt: '1 day ago',
    },
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    const newComment = {
      id: Date.now().toString(),
      username: user?.username || user?.fullName || 'ArcadePlayer',
      avatarUrl: user?.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40&auto=format&fit=crop',
      content: commentText.trim(),
      createdAt: 'Just now',
    }

    setComments(prev => [newComment, ...prev])
    setCommentText('')
    
    // Play light synth confirmation tone
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(450, ctx.currentTime)
      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    } catch {}

    // Dispatch database sync for backend persistent storage
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, content: newComment.content })
    }).catch(() => {})
  }

  return (
    <div className="flex flex-col gap-6 p-6 rounded-2xl glass border border-border/40">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <MessageSquare className="h-5 w-5 text-secondary" />
        <h2 className="text-lg font-bold font-display tracking-wider uppercase text-foreground">
          Player Discussion
        </h2>
      </div>

      {/* Input box section */}
      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="flex gap-3 items-start">
          <img
            src={user?.imageUrl}
            alt="User avatar"
            className="w-9 h-9 rounded-xl border border-primary/20 object-cover"
          />
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              required
              rows={2}
              placeholder="Join the discussion... write a review!"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full p-3 rounded-xl bg-muted/60 border border-border/60 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
            />
            <button
              type="submit"
              className="self-end h-9 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-primary/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Post Comment</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-muted/30 border border-border/30 gap-3">
          <ShieldAlert className="h-6 w-6 text-accent animate-bounce" />
          <div>
            <h4 className="text-sm font-bold text-foreground">Sign In to Comment</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Share your review and compete in the leaderboards.</p>
          </div>
          <SignInButton mode="modal">
            <button className="h-9 px-5 rounded-xl bg-secondary hover:bg-secondary/95 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-secondary/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
              Login to Account
            </button>
          </SignInButton>
        </div>
      )}

      {/* Comment List */}
      <div className="flex flex-col gap-4 mt-2">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 items-start hover:bg-muted/10 p-2.5 rounded-xl transition-colors">
            <img
              src={comment.avatarUrl}
              alt={comment.username}
              className="w-9 h-9 rounded-xl border border-border/40 object-cover bg-muted"
              suppressHydrationWarning
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                  {comment.username}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  {comment.createdAt}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
