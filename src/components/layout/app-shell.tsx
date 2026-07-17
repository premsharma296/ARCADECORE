'use client'

import React, { useState, useEffect } from 'react'
import Header from './header'
import Sidebar from './sidebar'
import Footer from './footer'
import LiveTickerBar from '@/components/ui/live-ticker-bar'
import { sound } from '@/lib/sound'
import { Volume2, VolumeX } from 'lucide-react'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [isEmbedded, setIsEmbedded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsEmbedded(window.self !== window.top)
    }

    // Check local storage setting
    const savedMusic = localStorage.getItem('arcadecore_bg_music')
    if (savedMusic === 'true') {
      setIsMusicPlaying(true)
    }

    const startOnInteraction = () => {
      if (localStorage.getItem('arcadecore_bg_music') === 'true') {
        sound.playBackgroundMusic()
      }
      window.removeEventListener('click', startOnInteraction)
      window.removeEventListener('keydown', startOnInteraction)
    }

    window.addEventListener('click', startOnInteraction)
    window.addEventListener('keydown', startOnInteraction)

    // Handle tab visibility changes (pauses music on tab hide, resumes on tab focus)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sound.stopBackgroundMusic()
      } else {
        if (localStorage.getItem('arcadecore_bg_music') === 'true') {
          sound.playBackgroundMusic()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('click', startOnInteraction)
      window.removeEventListener('keydown', startOnInteraction)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const toggleMusic = () => {
    if (isMusicPlaying) {
      sound.stopBackgroundMusic()
      localStorage.setItem('arcadecore_bg_music', 'false')
      setIsMusicPlaying(false)
    } else {
      sound.playBackgroundMusic()
      localStorage.setItem('arcadecore_bg_music', 'true')
      setIsMusicPlaying(true)
    }
  }

  if (isEmbedded) {
    return (
      <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-white font-sans">
        {/* Cyber Grid Background */}
        <div className="fixed inset-0 cyber-grid pointer-events-none z-0" />
        
        {/* Glow overlays */}
        <div className="fixed -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0" />
        <div className="fixed top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none z-0" />

        <div className="flex flex-1 relative z-10 w-full mx-auto p-0">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-white font-sans">
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 cyber-grid pointer-events-none z-0" />
      
      {/* Glow overlays */}
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none z-0" />

      {/* Header */}
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Live Ticker News Bar */}
      <LiveTickerBar />

      {/* Main Drawer Container */}
      <div className="flex flex-1 relative z-10 max-w-7xl w-full mx-auto">
        
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Sidebar mobile dim background overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 transition-all duration-300 lg:pl-64 flex flex-col min-h-[calc(100vh-64px)] px-4 py-8 sm:px-6 lg:px-8 gap-10">
          <div className="flex-1 flex flex-col gap-10">
            {children}
          </div>
          <Footer />
        </main>

        {/* Floating Background Music Controller */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={toggleMusic}
            className={`p-3 rounded-full border transition-all duration-300 shadow-xl cursor-pointer ${
              isMusicPlaying
                ? 'bg-primary text-white border-primary/20 hover:bg-primary/95 shadow-lg shadow-primary/30 hover:scale-[1.05]'
                : 'bg-[#100824] text-muted-foreground border-border/40 hover:text-foreground'
            }`}
            title={isMusicPlaying ? 'Mute Background Music' : 'Play Background Music'}
          >
            {isMusicPlaying ? (
              <Volume2 className="h-5 w-5 animate-pulse" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
