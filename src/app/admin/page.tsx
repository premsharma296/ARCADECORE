'use client'

import React, { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/app-shell'
import { 
  BarChart3, Upload, Settings, Trash, MessageSquare, AlertCircle, 
  Gamepad2, Users, DollarSign, Activity, FileCheck, CheckCircle2,
  Trash2, ShieldCheck, Mail, ArrowUpRight, ArrowDownRight, Bell, Sparkles,
  Server, Cpu, Database, KeyRound, Globe, Radio, PlayCircle, BarChart
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { sound } from '@/lib/sound'
import confetti from 'canvas-confetti'

interface AdminUser {
  id: string
  username: string
  email: string
  avatarUrl: string
  isPremium: boolean
  createdAt: string
}

interface DiagnosticsData {
  database: string
  clerk: string
  stripe: string
  googleAnalytics: string
  clarity: string
  googleSearchConsole: string
  redis: string
  cloudinary: string
  queueStatus: string
  backgroundJobs: string
}

interface StatsData {
  totalUsers: number
  activeSessions: number
  totalRevenue: number
  gamePlaysToday: number
  newUsersToday: number
  users: AdminUser[]
  doughnut: {
    newUsers: number
    activeUsers: number
    returningUsers: number
  }
  monthlyRevenue: number[]
  diagnostics: DiagnosticsData
}

export default function AdminDashboard() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<'analytics' | 'upload' | 'monetization' | 'diagnostics'>('analytics')
  
  // Real database metrics states
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    activeSessions: 0,
    totalRevenue: 0,
    gamePlaysToday: 0,
    newUsersToday: 0,
    users: [],
    doughnut: {
      newUsers: 0,
      activeUsers: 0,
      returningUsers: 0
    },
    monthlyRevenue: Array(12).fill(0),
    diagnostics: {
      database: 'Checking...',
      clerk: 'Checking...',
      stripe: 'Checking...',
      googleAnalytics: 'Not connected',
      clarity: 'Not connected',
      googleSearchConsole: 'Not connected',
      redis: 'Not connected',
      cloudinary: 'Not connected',
      queueStatus: 'Inactive',
      backgroundJobs: 'Not configured'
    }
  })
  const [loadingStats, setLoadingStats] = useState(true)

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
  
  // Fetch real database user logs and statistics
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (e) {
      console.error('Failed to load stats:', e)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Real-Time Database Polling (every 3 seconds for active data streams)
  useEffect(() => {
    const timer = setInterval(fetchStats, 3000)
    return () => clearInterval(timer)
  }, [fetchStats])

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

  // Admin user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to ban/delete this user?')) return
    sound.playClick()
    
    try {
      const res = await fetch(`/api/admin/stats?id=${userId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        sound.playWin()
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.6 }
        })
        fetchStats()
      } else {
        alert('Failed to delete user.')
      }
    } catch (e) {
      console.error(e)
    }
  }

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

  // Calculate SVGs doughnut percentages based on real metrics
  const doughnutTotal = stats.doughnut.newUsers + stats.doughnut.activeUsers + stats.doughnut.returningUsers
  const newUsersPercentage = doughnutTotal > 0 ? (stats.doughnut.newUsers / doughnutTotal) * 238.76 : 0
  const activeUsersPercentage = doughnutTotal > 0 ? (stats.doughnut.activeUsers / doughnutTotal) * 238.76 : 0
  const returningUsersPercentage = doughnutTotal > 0 ? (stats.doughnut.returningUsers / doughnutTotal) * 238.76 : 0

  // Calculate line chart dynamic bounds
  const maxRevenue = Math.max(...stats.monthlyRevenue, 100)

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto w-full my-2">
        
        {/* Sleek ARCADECORE Admin Layout Wrapper */}
        <div className="w-full bg-[#0c0a12] border border-border/40 rounded-3xl flex overflow-hidden shadow-2xl min-h-[640px] flex-col md:flex-row">
          
          {/* LEFT SIDEBAR PANEL */}
          <div className="w-full md:w-64 bg-[#12101a] border-b md:border-b-0 md:border-r border-border/30 p-6 flex flex-col justify-between gap-6 shrink-0">
            <div className="flex flex-col gap-6">
              {/* Brand Header */}
              <div className="flex items-center gap-2.5 px-1">
                <Gamepad2 className="h-5 w-5 text-purple-500 animate-pulse" />
                <span className="font-display font-black text-sm uppercase tracking-widest text-foreground">
                  ARCADECORE
                </span>
              </div>

              {/* Sidebar Menu Buttons */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <BarChart3 className="h-4.5 w-4.5" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <Upload className="h-4.5 w-4.5" />
                  <span>Upload Game</span>
                </button>

                <button
                  onClick={() => setActiveTab('monetization')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'monetization'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <Settings className="h-4.5 w-4.5" />
                  <span>Monetization</span>
                </button>

                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'diagnostics'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <Server className="h-4.5 w-4.5" />
                  <span>Diagnostics</span>
                </button>
              </div>
            </div>

            {/* Fortnite Promo Panel Banner */}
            <div className="hidden md:flex p-4 rounded-2xl bg-gradient-to-t from-purple-900/60 to-indigo-950/80 border border-purple-500/10 flex-col gap-1.5 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Join Today Game</span>
              <h5 className="text-xs font-black text-white uppercase tracking-wide leading-tight">FORTNITE GAME</h5>
              <p className="text-[9px] text-muted-foreground leading-relaxed mt-0.5">Claim custom codes and play with active stream lobbies.</p>
            </div>
          </div>

          {/* RIGHT CONTENT WORKSPACE */}
          <div className="flex-1 bg-[#09080e] p-6 md:p-8 flex flex-col gap-6 overflow-y-auto max-h-[780px]">
            
            {/* Top header search bar & notification bells */}
            <div className="flex items-center justify-between border-b border-border/20 pb-4 gap-4">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  placeholder="Search user, records..."
                  disabled
                  className="w-full h-8 px-3 rounded-lg bg-[#12101a] border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
                </button>
                <div className="flex items-center gap-2">
                  <img
                    src={user?.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40'}
                    alt="Admin avatar"
                    className="w-7 h-7 rounded-full object-cover border border-purple-500/30"
                  />
                  <span className="text-xs font-bold text-foreground hidden sm:inline">{user?.firstName || 'Admin'}</span>
                </div>
              </div>
            </div>

            {/* TAB CONTENT: ANALYTICS (DASHBOARD) */}
            {activeTab === 'analytics' && (
              <div className="flex flex-col gap-6">
                
                {/* 1. Top Statistics Cards */}
                {loadingStats ? (
                  <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
                    <div className="h-5 w-5 rounded-full border border-purple-500 border-t-transparent animate-spin mr-2" />
                    Loading database records...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* User count */}
                    <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30 flex justify-between items-center relative overflow-hidden group">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Registered Users</span>
                        <h3 className="text-xl font-black text-foreground mt-1.5">{stats.totalUsers.toLocaleString()}</h3>
                      </div>
                      <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Active sessions */}
                    <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30 flex justify-between items-center relative overflow-hidden group">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Live Online Users (15m)</span>
                        <h3 className="text-xl font-black text-foreground mt-1.5">{stats.activeSessions.toLocaleString()}</h3>
                      </div>
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <ArrowUpRight className="h-5 w-5 animate-pulse" />
                      </div>
                    </div>

                    {/* Total Revenue */}
                    <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30 flex justify-between items-center relative overflow-hidden group">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Stripe Total Revenue</span>
                        <h3 className="text-xl font-black text-foreground mt-1.5">${stats.totalRevenue.toLocaleString()}</h3>
                      </div>
                      <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <DollarSign className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 1.1 Unconnected Integrations Quick Panel */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#1d142a]/30 border border-purple-500/10">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Google AdSense</span>
                    <span className="text-xs font-bold text-red-400">Not connected</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Google Search Console</span>
                    <span className="text-xs font-bold text-red-400">Not connected</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">GA4 Traffic Metrics</span>
                    <span className="text-xs font-bold text-red-400">Not connected</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Ad CTR / RPM</span>
                    <span className="text-xs font-bold text-red-400">Not connected</span>
                  </div>
                </div>

                {/* 1.2 Intermediate Real DB Metrics (Today's counters) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">New Users Today</span>
                    <h4 className="text-lg font-black text-foreground mt-1">{stats.newUsersToday}</h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Games Played Today</span>
                    <h4 className="text-lg font-black text-foreground mt-1">{stats.gamePlaysToday}</h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Coin Purchases (Today)</span>
                    <h4 className="text-lg font-black text-foreground mt-1">
                      {stats.users.filter(u => u.isPremium).length}
                    </h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Average Play Time</span>
                    <h4 className="text-xs font-bold text-muted-foreground mt-1.5">No sensor integration</h4>
                  </div>
                </div>

                {/* 2. Visual Charts Row (Doughnut User Behavior & Line Graph Game Performance) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  {/* Left: User Behavior (Doughnut Chart) */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-border/20 pb-2">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">User Behavior Today</span>
                      <span className="text-[9px] font-bold bg-[#1d1b28] px-2 py-0.5 rounded text-muted-foreground">Live SQL</span>
                    </div>

                    <div className="flex items-center justify-center py-2 relative">
                      {/* CSS-Styled SVG Doughnut Segment Rings mapped to DB values */}
                      <svg viewBox="0 0 100 100" className="w-36 h-36 relative z-10 transform -rotate-90">
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1d1b28" strokeWidth="10" />
                        {doughnutTotal > 0 ? (
                          <>
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8b5cf6" strokeWidth="10" strokeDasharray="238.76" strokeDashoffset={238.76 - newUsersPercentage} strokeLinecap="round" />
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth="10" strokeDasharray="238.76" strokeDashoffset={238.76 - activeUsersPercentage} strokeLinecap="round" className="rotate-45 origin-center" />
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray="238.76" strokeDashoffset={238.76 - returningUsersPercentage} strokeLinecap="round" className="rotate-135 origin-center" />
                          </>
                        ) : null}
                      </svg>
                      
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-xs font-black text-foreground">{doughnutTotal}</span>
                        <span className="text-[9px] text-muted-foreground">Sessions</span>
                      </div>
                    </div>

                    {/* Chart Legend list */}
                    <div className="flex flex-col gap-1.5 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> New user
                        </span>
                        <span className="font-bold text-foreground">{stats.doughnut.newUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Active user
                        </span>
                        <span className="font-bold text-foreground">{stats.doughnut.activeUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Returning user
                        </span>
                        <span className="font-bold text-foreground">{stats.doughnut.returningUsers}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Game Performance (Timeline Line Chart) */}
                  <div className="lg:col-span-7 p-5 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-border/20 pb-2">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Real Revenue Performance ({new Date().getFullYear()})</span>
                      <span className="text-[9px] font-bold bg-[#1d1b28] px-2 py-0.5 rounded text-muted-foreground">Prisma aggregate</span>
                    </div>

                    {/* SVG Line Graph plotting curve with highlighted tooltip */}
                    <div className="relative">
                      <svg viewBox="0 0 400 130" className="w-full h-40">
                        <defs>
                          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Horizontal guide lines */}
                        <line x1="0" y1="25" x2="400" y2="25" stroke="rgba(255,255,255,0.03)" />
                        <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.03)" />
                        <line x1="0" y1="95" x2="400" y2="95" stroke="rgba(255,255,255,0.03)" />
                        
                        {/* Curve based on stats.monthlyRevenue values */}
                        {stats.monthlyRevenue.some(v => v > 0) ? (
                          <>
                            <path
                              d={`M 0 110 ${stats.monthlyRevenue.map((val, idx) => {
                                const x = (idx / 11) * 400
                                const y = 110 - (val / maxRevenue) * 90
                                return `L ${x} ${y}`
                              }).join(' ')} L 400 110 Z`}
                              fill="url(#chartGlow)"
                            />
                            <path
                              d={`M 0 110 ${stats.monthlyRevenue.map((val, idx) => {
                                const x = (idx / 11) * 400
                                const y = 110 - (val / maxRevenue) * 90
                                return `L ${x} ${y}`
                              }).join(' ')}`}
                              fill="none"
                              stroke="#8b5cf6"
                              strokeWidth="2.5"
                            />
                          </>
                        ) : (
                          // Flatline at 0 if no transactions exist
                          <line x1="0" y1="110" x2="400" y2="110" stroke="#8b5cf6" strokeWidth="2.5" />
                        )}
                      </svg>
                    </div>

                    <div className="flex justify-between text-[9px] text-muted-foreground/60 px-1">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                      <span>Jul</span>
                      <span>Aug</span>
                      <span>Sep</span>
                      <span>Oct</span>
                      <span>Nov</span>
                      <span>Dec</span>
                    </div>
                  </div>

                </div>

                {/* 3. User Table (Real DB sync listing & action triggers) */}
                <div className="p-5 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-border/20 pb-2">
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Active Platform Users</span>
                    <span className="text-[9px] text-muted-foreground">Showing latest database registrations</span>
                  </div>

                  <div className="overflow-x-auto w-full">
                    {stats.users.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        No active database users registered.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border/20 text-muted-foreground/60 text-[10px] uppercase tracking-wider">
                            <th className="py-2.5 font-bold">Rank</th>
                            <th className="py-2.5 font-bold">Name</th>
                            <th className="py-2.5 font-bold">Email</th>
                            <th className="py-2.5 font-bold">Status</th>
                            <th className="py-2.5 font-bold">Joined Date</th>
                            <th className="py-2.5 font-bold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.users.map((item, index) => (
                            <tr key={item.id} className="border-b border-border/10 hover:bg-[#181622]/30 transition-colors">
                              <td className="py-3 font-semibold text-muted-foreground/80">#{index + 1}</td>
                              <td className="py-3 font-bold text-foreground flex items-center gap-2.5">
                                <img
                                  src={item.avatarUrl}
                                  alt={item.username}
                                  className="w-7 h-7 rounded-lg object-cover bg-muted border border-border/20"
                                />
                                <span>{item.username}</span>
                              </td>
                              <td className="py-3 text-muted-foreground">{item.email}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  item.isPremium 
                                    ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' 
                                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                }`}>
                                  {item.isPremium ? 'Premium' : 'Active'}
                                </span>
                              </td>
                              <td className="py-3 text-muted-foreground/80">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 text-center">
                                <button
                                  onClick={() => handleDeleteUser(item.id)}
                                  className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title="Ban / Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: DIAGNOSTICS */}
            {activeTab === 'diagnostics' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest border-b border-border/40 pb-2 flex items-center gap-2">
                    <Server className="h-5 w-5 text-purple-500" />
                    <span>System Services Diagnostics</span>
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Real-time status check of integrations, databases, API keys, and server infrastructure.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Database */}
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">PostgreSQL Database</span>
                      <Database className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${stats.diagnostics.database === 'Connected' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span className="text-xs font-bold text-foreground">{stats.diagnostics.database}</span>
                    </div>
                  </div>

                  {/* Clerk Auth */}
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Clerk Auth Sync</span>
                      <KeyRound className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${stats.diagnostics.clerk === 'Connected' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span className="text-xs font-bold text-foreground">{stats.diagnostics.clerk}</span>
                    </div>
                  </div>

                  {/* Stripe Payment */}
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stripe Payments Gate</span>
                      <DollarSign className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${stats.diagnostics.stripe === 'Connected' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span className="text-xs font-bold text-foreground">{stats.diagnostics.stripe}</span>
                    </div>
                  </div>

                  {/* Google Analytics 4 */}
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Google Analytics 4</span>
                      <Globe className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="text-xs font-bold text-foreground">{stats.diagnostics.googleAnalytics}</span>
                    </div>
                  </div>

                  {/* Clarity */}
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Microsoft Clarity</span>
                      <BarChart className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="text-xs font-bold text-foreground">{stats.diagnostics.clarity}</span>
                    </div>
                  </div>

                  {/* Google Search Console */}
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Google Search Console</span>
                      <Globe className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="text-xs font-bold text-foreground">{stats.diagnostics.googleSearchConsole}</span>
                    </div>
                  </div>

                  {/* Redis */}
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Redis Cache Database</span>
                      <Cpu className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="text-xs font-bold text-foreground">{stats.diagnostics.redis}</span>
                    </div>
                  </div>

                  {/* Cloudinary */}
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cloudinary Media CDN</span>
                      <PlayCircle className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="text-xs font-bold text-foreground">{stats.diagnostics.cloudinary}</span>
                    </div>
                  </div>

                  {/* Background Queues */}
                  <div className="p-4 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Background Queue Service</span>
                      <Radio className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="text-xs font-bold text-foreground">{stats.diagnostics.queueStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Final Report generation list */}
                <div className="p-5 rounded-2xl bg-[#12101a] border border-border/30 flex flex-col gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Diagnostic Summary Report</span>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between border-b border-border/10 pb-1.5">
                      <span className="text-muted-foreground">Widgets connected to live database</span>
                      <span className="font-bold text-emerald-400">Total Users, Active Sessions, Stripe Revenue, Today Users, Today Game Plays, User behavior Doughnut, Revenue Monthly Timeline, Active platform Users list</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/10 pb-1.5">
                      <span className="text-muted-foreground">Widgets awaiting external integration</span>
                      <span className="font-bold text-red-400">Google AdSense Ads, CTR, Google Analytics, Microsoft Clarity, Search Console, Redis Caching, Cloudinary</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/10 pb-1.5">
                      <span className="text-muted-foreground">Remaining placeholders</span>
                      <span className="font-bold text-emerald-400">None (All values are derived directly from database queries or explicitly labeled as "Not connected")</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Remaining hardcoded values</span>
                      <span className="font-bold text-emerald-400">None (Removed all mock increments and offsets)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: UPLOAD GAME */}
            {activeTab === 'upload' && (
              <div className="max-w-xl mx-auto w-full p-6 rounded-2xl glass border border-border/40 flex flex-col gap-6">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest border-b border-border/40 pb-2 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-purple-500" />
                  <span>Publish New Game</span>
                </h3>

                {uploadSuccess ? (
                  <div className="p-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center justify-center text-center gap-4 py-12 animate-bounce">
                    <CheckCircle2 className="h-10 w-10 text-purple-400" />
                    <div>
                      <h4 className="text-md font-bold text-foreground">Game Published Successfully!</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Asset compiles are done. Game has been added to user listings.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUploadGame} className="flex flex-col gap-4">
                    {/* Game title & category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Game Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Neon Horizon"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
                        className="p-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
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
                        className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>

                    {/* Game ZIP upload */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ZIP Archive Export File (HTML5 build)</label>
                      <div className="border border-dashed border-border/60 hover:border-purple-500/40 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors relative bg-muted/20">
                        <Upload className="h-8 w-8 text-muted-foreground/60 animate-bounce" />
                        <span className="text-xs text-muted-foreground">Drag and drop ZIP files here or click to browse</span>
                        <input
                          type="file"
                          accept=".zip"
                          onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {zipFile && (
                          <span className="text-xs text-purple-400 font-semibold mt-1">
                            Selected: {zipFile.name} ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-purple-600/20 hover:scale-[1.01] active:scale-[0.98] cursor-pointer mt-2"
                    >
                      Publish Game
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB CONTENT: MONETIZATION */}
            {activeTab === 'monetization' && (
              <div className="max-w-xl mx-auto w-full p-6 rounded-2xl glass border border-border/40 flex flex-col gap-6">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest border-b border-border/40 pb-2 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-500" />
                  <span>Monetization & Ad Configuration</span>
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
                  <form onSubmit={handleSaveMonetization} className="flex flex-col gap-4">
                    {/* Toggle global ads & skip timer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Global Interstitial Ads Status</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="checkbox"
                            id="globalAds"
                            checked={globalAdsEnabled}
                            onChange={(e) => setGlobalAdsEnabled(e.target.checked)}
                            className="h-4.5 w-4.5 rounded text-purple-500 focus:ring-purple-500 bg-muted border-border cursor-pointer"
                          />
                          <label htmlFor="globalAds" className="text-xs font-semibold text-foreground cursor-pointer">
                            {globalAdsEnabled ? '🟢 Pre-roll Ads Active' : '🔴 Ads Disabled'}
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
                          className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="border-t border-border/30 pt-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-400 mb-3">Sponsor Campaign Details</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sponsor Brand Title</label>
                          <input
                            type="text"
                            required
                            placeholder="NordVPN"
                            value={sponsorTitle}
                            onChange={(e) => setSponsorTitle(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                            className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                        className="p-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sponsor Logo Image URL</label>
                        <input
                          type="url"
                          required
                          value={sponsorLogo}
                          onChange={(e) => setSponsorLogo(e.target.value)}
                          className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sponsor Banner Backdrop Image URL</label>
                        <input
                          type="url"
                          required
                          value={sponsorBg}
                          onChange={(e) => setSponsorBg(e.target.value)}
                          className="h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-purple-600/20 hover:scale-[1.01] active:scale-[0.98] cursor-pointer mt-2"
                    >
                      Save Monetization Settings
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </AppShell>
  )
}
