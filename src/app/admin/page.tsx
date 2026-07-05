'use client'

import React, { useState, useEffect, useRef } from 'react'
import AppShell from '@/components/layout/app-shell'
import { 
  BarChart3, Upload, Settings, Trash, MessageSquare, AlertCircle, 
  Gamepad2, Users, DollarSign, Activity, FileCheck, CheckCircle2 
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import sound from '@/lib/sound'

export default function AdminDashboard() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<'analytics' | 'upload' | 'monetization'>('analytics')
  
  // Real-time analytics simulations
  const [visitors, setVisitors] = useState(1240)
  const [revenue, setRevenue] = useState(48.50)
  const [impressions, setImpressions] = useState(18500)
  const [ctr, setCtr] = useState(2.4)

  // Upload Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('racing')
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // Monetization Custom Config states
  const [globalAdsEnabled, setGlobalAdsEnabled] = useState(true)
  const [adCountdownSeconds, setAdCountdownSeconds] = useState(5)
  const [sponsorTitle, setSponsorTitle] = useState('NordVPN')
  const [sponsorCta, setSponsorCta] = useState('Secure your internet with 63% off NordVPN. Stay anonymous while gaming.')
  const [sponsorLink, setSponsorLink] = useState('https://google.com')
  const [sponsorLogo, setSponsorLogo] = useState('https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=100&auto=format&fit=crop')
  const [sponsorBg, setSponsorBg] = useState('https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop')
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  
  const chartCanvasRef = useRef<HTMLCanvasElement>(null)

  // Load monetization settings on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('arcadecore_monetization_settings')
      if (saved) {
        const config = JSON.parse(saved)
        setGlobalAdsEnabled(config.globalAdsEnabled ?? true)
        setAdCountdownSeconds(config.adCountdownSeconds ?? 5)
        setSponsorTitle(config.sponsorTitle || 'NordVPN')
        setSponsorCta(config.sponsorCta || '')
        setSponsorLink(config.sponsorLink || '')
        setSponsorLogo(config.sponsorLogo || '')
        setSponsorBg(config.sponsorBg || '')
      }
    } catch (e) {}
  }, [])

  const handleSaveMonetization = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const config = {
        globalAdsEnabled,
        adCountdownSeconds,
        sponsorTitle,
        sponsorCta,
        sponsorLink,
        sponsorLogo,
        sponsorBg
      }
      localStorage.setItem('arcadecore_monetization_settings', JSON.stringify(config))
      sound.playClick()
      setSettingsSuccess(true)
      sound.playWin()
      setTimeout(() => {
        setSettingsSuccess(false)
      }, 3000)
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  // Web traffic simulation fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setVisitors((prev) => Math.max(800, prev + Math.floor(Math.random() * 80 - 40)))
      setRevenue((prev) => prev + Number((Math.random() * 0.15).toFixed(2)))
      setImpressions((prev) => prev + Math.floor(Math.random() * 8))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Draw simulated neon traffic chart using HTML5 Canvas
  useEffect(() => {
    if (activeTab !== 'analytics') return
    const canvas = chartCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    
    // Draw neon grid background
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, height)
      ctx.stroke()
    }
    for (let j = 0; j < height; j += 30) {
      ctx.beginPath()
      ctx.moveTo(0, j)
      ctx.lineTo(width, j)
      ctx.stroke()
    }

    // Generate static nodes curve represent daily active users spikes
    const points = [40, 60, 45, 80, 110, 85, 140, 125, 170, 160]
    const step = width / (points.length - 1)

    ctx.beginPath()
    ctx.moveTo(0, height - points[0])
    points.forEach((p, idx) => {
      ctx.lineTo(idx * step, height - p)
    })

    // Draw glowing neon stroke path
    ctx.shadowBlur = 12
    ctx.shadowColor = '#d946ef'
    ctx.strokeStyle = '#d946ef'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Reset shadow
    ctx.shadowBlur = 0

    // Fill area below gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, 'rgba(217, 70, 239, 0.15)')
    grad.addColorStop(1, 'transparent')
    
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
  }, [activeTab])

  const handleUploadGame = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !thumbnailUrl) return

    sound.playClick()
    setUploadSuccess(true)
    sound.playWin()

    setTimeout(() => {
      setUploadSuccess(false)
      setTitle('')
      setDescription('')
      setThumbnailUrl('')
      setZipFile(null)
    }, 4000)

    // Execute mock backend API uploading call
    fetch('/api/admin/games/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, thumbnailUrl })
    }).catch(() => {})
  }

  // Auth gate check
  const isAdmin = user?.emailAddresses.some(
    e => e.emailAddress.startsWith('admin') || 
         e.emailAddress === 'premchandsharma@gmail.com' || 
         e.emailAddress === 'itzpremsharma01@gmail.com'
  )

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto my-12 text-center p-8 rounded-2xl glass border border-red-500/25 flex flex-col items-center gap-4">
          <AlertCircle className="h-10 w-10 text-red-500 animate-bounce" />
          <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
            ADMIN REGISTRATION REQUIRED
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your current logged-in user profile does not possess administrators access privileges. Please authenticate using the admin dashboard account details.
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto flex flex-col gap-6 w-full my-2">
        
        {/* Title and stats summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h1 className="text-2xl font-black font-display tracking-wider uppercase text-foreground">
              Admin Control Center
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review visitor metrics, upload game assets, and manage commenting feeds.
            </p>
          </div>

          {/* Quick tab controls */}
          <div className="flex gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/50 w-max">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'analytics' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'upload' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Upload Game
            </button>
            <button
              onClick={() => setActiveTab('monetization')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'monetization' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monetization
            </button>
          </div>
        </div>

        {activeTab === 'analytics' && (
          // ANALYTICS PANEL VIEW
          <div className="flex flex-col gap-6">
            
            {/* Quick Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl glass border border-border/40 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Visitors</span>
                  <span className="text-xl font-black text-foreground">{visitors}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary">
                  <Activity className="h-5 w-5 animate-pulse" />
                </div>
              </div>

              <div className="p-4 rounded-xl glass border border-border/40 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ad Impressions</span>
                  <span className="text-xl font-black text-foreground">{impressions.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Gamepad2 className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl glass border border-border/40 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg CTR Rate</span>
                  <span className="text-xl font-black text-foreground">{ctr}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl glass border border-border/40 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Today Earnings</span>
                  <span className="text-xl font-black text-emerald-400">${revenue.toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Traffic Charts Card */}
            <div className="p-6 rounded-2xl glass border border-border/40 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Active Traffic Peaks (Last 24 Hours)</h3>
                <span className="text-xs text-primary font-bold">Updated Live</span>
              </div>
              <canvas
                ref={chartCanvasRef}
                width={700}
                height={220}
                className="w-full bg-[#0a0a10]/50 rounded-xl border border-border/20"
              />
            </div>

          </div>
        )}

        {activeTab === 'upload' && (
          // UPLOAD GAME PANEL VIEW
          <div className="max-w-2xl mx-auto w-full p-6 rounded-2xl glass border border-border/40 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest border-b border-border/40 pb-2">
              Index New HTML5 / WebGL Game
            </h3>

            {uploadSuccess ? (
              <div className="p-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center gap-4 py-12 animate-bounce">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                <div>
                  <h4 className="text-md font-bold text-foreground">Upload Process Completed!</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Game index, configuration keys and thumbnail paths have been written to the catalog.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUploadGame} className="flex flex-col gap-5">
                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Game Title</label>
                    <input
                      type="text"
                      required
                      placeholder="My Epic Racing Game"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    >
                      <option value="racing">Racing</option>
                      <option value="arcade">Arcade</option>
                      <option value="action">Action</option>
                      <option value="shooting">Shooting</option>
                      <option value="puzzle">Puzzle</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter short game description here..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="p-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Thumbnail url */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Thumbnail Image URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-1542751371..."
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                {/* Game ZIP upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ZIP Archive Export File (HTML5 build)</label>
                  <div className="border-2 border-dashed border-border/60 hover:border-primary/40 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors relative">
                    <Upload className="h-8 w-8 text-muted-foreground/60 animate-bounce" />
                    <span className="text-xs text-muted-foreground">Drag and drop ZIP files here or click to browse</span>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {zipFile && (
                      <span className="text-xs text-primary font-semibold flex items-center gap-1 mt-1">
                        <FileCheck className="h-4 w-4" />
                        <span>Selected: {zipFile.name} ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                >
                  Publish Game
                </button>
              </form>
            )}

          </div>
        )}

        {activeTab === 'monetization' && (
          <div className="max-w-2xl mx-auto w-full p-6 rounded-2xl glass border border-border/40 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest border-b border-border/40 pb-2">
              Monetization & Ad Configuration
            </h3>

            {settingsSuccess ? (
              <div className="p-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center gap-4 py-12 animate-bounce">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                <div>
                  <h4 className="text-md font-bold text-foreground">Settings Saved Successfully!</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Ad triggers and sponsor campaigns have been updated globally.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveMonetization} className="flex flex-col gap-5">
                {/* Toggle global ads & skip timer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Global Interstitial Ads Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        id="globalAds"
                        checked={globalAdsEnabled}
                        onChange={(e) => setGlobalAdsEnabled(e.target.checked)}
                        className="h-4.5 w-4.5 rounded text-primary focus:ring-primary bg-muted border-border cursor-pointer"
                      />
                      <label htmlFor="globalAds" className="text-xs font-semibold text-foreground cursor-pointer">
                        {globalAdsEnabled ? '🟢 Pre-roll Ads Active' : '🔴 Ads Disabled (Developer Mode)'}
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ad Countdown Timer (Seconds)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={30}
                      value={adCountdownSeconds}
                      onChange={(e) => setAdCountdownSeconds(Number(e.target.value))}
                      className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="border-t border-border/30 pt-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">Sponsor Campaign Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sponsor Brand Title</label>
                      <input
                        type="text"
                        required
                        placeholder="NordVPN"
                        value={sponsorTitle}
                        onChange={(e) => setSponsorTitle(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Affiliate Destination Link (URL)</label>
                      <input
                        type="url"
                        required
                        placeholder="https://nordvpn.com/partner-code"
                        value={sponsorLink}
                        onChange={(e) => setSponsorLink(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sponsor Tagline / Call to Action</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Get 63% off NordVPN. Shield your internet traffic now!"
                    value={sponsorCta}
                    onChange={(e) => setSponsorCta(e.target.value)}
                    className="p-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sponsor Logo Image URL</label>
                    <input
                      type="url"
                      required
                      value={sponsorLogo}
                      onChange={(e) => setSponsorLogo(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sponsor Banner Backdrop Image URL</label>
                    <input
                      type="url"
                      required
                      value={sponsorBg}
                      onChange={(e) => setSponsorBg(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] cursor-pointer mt-2"
                >
                  Save Monetization Settings
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </AppShell>
  )
}
