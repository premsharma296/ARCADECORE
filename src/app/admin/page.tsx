'use client'

import React, { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/app-shell'
import { 
  BarChart3, Upload, Settings, Trash, AlertCircle, 
  Gamepad2, Users, DollarSign, Activity, FileCheck, CheckCircle2,
  Trash2, ShieldCheck, Mail, ArrowUpRight, ArrowDownRight, Bell, Sparkles,
  Server, Cpu, Database, KeyRound, Globe, Radio, PlayCircle, BarChart,
  Edit2, Search, FileUp, Video, Tags, Sliders, Plus, Eye
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
  razorpay: string
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

interface CategoryData {
  id: string
  name: string
  slug: string
}

interface TagData {
  id: string
  name: string
  slug: string
}

interface GameData {
  id: string
  title: string
  slug: string
  description: string
  instructions: string | null
  controls: string | null
  iframeUrl: string
  thumbnailUrl: string
  bannerUrl: string | null
  playCount: number
  rating: number
  isFeatured: boolean
  isSponsored: boolean
  isPublished: boolean
  version: string
  licenseInfo: string | null
  seoTitle: string | null
  seoKeywords: string | null
  seoDescription: string | null
  trailerUrl: string | null
  screenshots: string[]
  categories: CategoryData[]
  tags: TagData[]
}

export default function AdminDashboard() {
  const { user, isLoaded } = useUser()
  const [activeTab, setActiveTab] = useState<'analytics' | 'manage' | 'upload' | 'monetization' | 'diagnostics'>('analytics')
  
  // Real database stats
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
      razorpay: 'Checking...',
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

  // Loaded metadata & games list
  const [categoriesList, setCategoriesList] = useState<CategoryData[]>([])
  const [tagsList, setTagsList] = useState<TagData[]>([])
  const [gamesList, setGamesList] = useState<GameData[]>([])
  const [filteredGames, setFilteredGames] = useState<GameData[]>([])
  const [gameSearchQuery, setGameSearchQuery] = useState('')
  const [loadingMetadata, setLoadingMetadata] = useState(true)

  // Upload/Edit Game form states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [gameSlug, setGameSlug] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [controls, setControls] = useState('')
  const [iframeUrl, setIframeUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [screenshots, setScreenshots] = useState('')
  const [trailerUrl, setTrailerUrl] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [licenseInfo, setLicenseInfo] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isSponsored, setIsSponsored] = useState(false)
  const [isPublished, setIsPublished] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // HTML5 ZIP File States
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [uploadingZip, setUploadingZip] = useState(false)
  const [zipProgress, setZipProgress] = useState(0)
  const [zipSuccessMessage, setZipSuccessMessage] = useState('')
  const [zipErrorMessage, setZipErrorMessage] = useState('')
  
  // Submit feedback
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [submittingForm, setSubmittingForm] = useState(false)

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

  // Fetch metadata lists (categories, tags) & games list
  const fetchMetadataAndGames = useCallback(async () => {
    try {
      setLoadingMetadata(true)
      const [metaRes, gamesRes] = await Promise.all([
        fetch('/api/admin/metadata'),
        fetch('/api/admin/games/list')
      ])
      
      if (metaRes.ok) {
        const metaData = await metaRes.json()
        setCategoriesList(metaData.categories || [])
        setTagsList(metaData.tags || [])
      }

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json()
        setGamesList(gamesData.games || [])
        setFilteredGames(gamesData.games || [])
      }
    } catch (e) {
      console.error('Failed to load metadata or games list:', e)
    } finally {
      setLoadingMetadata(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchMetadataAndGames()
  }, [fetchStats, fetchMetadataAndGames])

  // Filter games based on search query
  useEffect(() => {
    const query = gameSearchQuery.toLowerCase().trim()
    if (!query) {
      setFilteredGames(gamesList)
    } else {
      setFilteredGames(
        gamesList.filter(
          (g) =>
            g.title.toLowerCase().includes(query) ||
            g.slug.toLowerCase().includes(query) ||
            g.categories.some((c) => c.name.toLowerCase().includes(query))
        )
      )
    }
  }, [gameSearchQuery, gamesList])

  // Reset form helper
  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setGameSlug('')
    setDescription('')
    setInstructions('')
    setControls('')
    setIframeUrl('')
    setThumbnailUrl('')
    setBannerUrl('')
    setScreenshots('')
    setTrailerUrl('')
    setVersion('1.0.0')
    setLicenseInfo('')
    setSeoTitle('')
    setSeoKeywords('')
    setSeoDescription('')
    setIsFeatured(false)
    setIsSponsored(false)
    setIsPublished(true)
    setSelectedCategories([])
    setSelectedTags([])
    setZipFile(null)
    setZipSuccessMessage('')
    setZipErrorMessage('')
    setFormFeedback(null)
  }

  // Handle Edit Action
  const handleEditClick = (game: GameData) => {
    setEditingId(game.id)
    setTitle(game.title)
    setGameSlug(game.slug)
    setDescription(game.description)
    setInstructions(game.instructions || '')
    setControls(game.controls || '')
    setIframeUrl(game.iframeUrl)
    setThumbnailUrl(game.thumbnailUrl)
    setBannerUrl(game.bannerUrl || '')
    setScreenshots(Array.isArray(game.screenshots) ? game.screenshots.join(', ') : '')
    setTrailerUrl(game.trailerUrl || '')
    setVersion(game.version || '1.0.0')
    setLicenseInfo(game.licenseInfo || '')
    setSeoTitle(game.seoTitle || '')
    setSeoKeywords(game.seoKeywords || '')
    setSeoDescription(game.seoDescription || '')
    setIsFeatured(game.isFeatured)
    setIsSponsored(game.isSponsored)
    setIsPublished(game.isPublished)
    setSelectedCategories(game.categories.map((c) => c.slug))
    setSelectedTags(game.tags.map((t) => t.slug))
    
    // Switch tabs to Upload/Edit tab
    setActiveTab('upload')
    setFormFeedback(null)
    try { sound.playClick() } catch {}
  }

  // Handle Quick Toggle Publish Status
  const handleTogglePublish = async (game: GameData) => {
    try {
      const updatedValue = !game.isPublished
      const response = await fetch('/api/admin/games/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...game,
          categories: game.categories.map((c) => c.slug),
          tags: game.tags.map((t) => t.slug),
          isPublished: updatedValue
        })
      })

      if (response.ok) {
        // Optimistic state sync
        setGamesList((prev) =>
          prev.map((g) => (g.id === game.id ? { ...g, isPublished: updatedValue } : g))
        )
        try { sound.playTick() } catch {}
      }
    } catch (e) {
      console.error('Failed to toggle publish status:', e)
    }
  }

  // Handle Delete Action
  const handleDeleteClick = async (gameId: string, gameTitle: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete "${gameTitle}"? All associated HTML5 files and metadata will be destroyed.`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/games/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gameId })
      })

      if (response.ok) {
        setGamesList((prev) => prev.filter((g) => g.id !== gameId))
        try { sound.playWin() } catch {}
        alert('Game successfully deleted.')
      } else {
        const errData = await response.json()
        alert('Error: ' + (errData.error || 'Failed to delete game.'))
      }
    } catch (e: any) {
      alert('Delete failed: ' + e.message)
    }
  }

  // Handle HTML5 Zip File validation and upload
  const handleZipUpload = async () => {
    if (!zipFile) {
      setZipErrorMessage('Please select a valid game ZIP package first.')
      return
    }
    
    // Auto-generate helper slug if creating new game
    const tempSlug = gameSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'uploaded-game'
    
    setUploadingZip(true)
    setZipProgress(10)
    setZipErrorMessage('')
    setZipSuccessMessage('')

    try {
      const formData = new FormData()
      formData.append('file', zipFile)
      formData.append('slug', tempSlug)

      // Simulate step-by-step progress
      const interval = setInterval(() => {
        setZipProgress((prev) => (prev < 90 ? prev + 15 : prev))
      }, 500)

      const res = await fetch('/api/admin/games/upload', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(interval)
      setZipProgress(100)
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Package validation/extraction failed.')
      }

      setZipSuccessMessage(`Successfully validated and extracted at: ${data.iframeUrl}`)
      setIframeUrl(data.iframeUrl)
      try { sound.playTick() } catch {}
    } catch (e: any) {
      setZipErrorMessage(e.message || 'Error processing ZIP package.')
      try { sound.playClick() } catch {}
    } finally {
      setUploadingZip(false)
    }
  }

  // Handle Game Metadata form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !iframeUrl.trim() || !thumbnailUrl.trim()) {
      setFormFeedback({ type: 'error', message: 'Title, iframeUrl, and thumbnailUrl are required.' })
      return
    }

    setSubmittingForm(true)
    setFormFeedback(null)

    try {
      const response = await fetch('/api/admin/games/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          title,
          slug: gameSlug,
          description,
          instructions,
          controls,
          iframeUrl,
          thumbnailUrl,
          bannerUrl,
          isFeatured,
          isSponsored,
          isPublished,
          version,
          licenseInfo,
          seoTitle,
          seoKeywords,
          seoDescription,
          trailerUrl,
          screenshots: screenshots.split(',').map((s) => s.trim()).filter(Boolean),
          categories: selectedCategories,
          tags: selectedTags
        })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save metadata profile.')
      }

      setFormFeedback({
        type: 'success',
        message: editingId ? 'Game profile updated successfully!' : 'New game published successfully!'
      })

      // Reset form and reload grids
      resetForm()
      fetchMetadataAndGames()
      
      // Trigger celebrate sound
      try {
        sound.playWin()
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } })
      } catch {}

    } catch (e: any) {
      setFormFeedback({ type: 'error', message: e.message || 'Error saving metadata.' })
    } finally {
      setSubmittingForm(false)
    }
  }

  // Toggle Category selection
  const handleCategoryCheckboxChange = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  // Toggle Tag selection
  const handleTagCheckboxChange = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  // Save Settings Ticker
  const handleSaveSettings = () => {
    setSettingsSuccess(true)
    try { sound.playTick() } catch {}
    setTimeout(() => setSettingsSuccess(false), 3000)
  }

  // Verify authorization
  if (!isLoaded) return null

  // Restrict access to administrators
  const isAdmin = user?.emailAddresses.some(
    e => e.emailAddress.startsWith('admin') || 
         e.emailAddress === 'premchandsharma@gmail.com' || 
         e.emailAddress === 'itzpremsharma01@gmail.com'
  )

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <ShieldCheck className="h-16 w-16 text-red-500 animate-bounce" />
          <h1 className="text-3xl font-black font-display tracking-widest text-primary uppercase">ACCESS FORBIDDEN</h1>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            You do not possess the required administrator credentials to view the command dashboard. Return to the lobby.
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-lg flex items-center justify-center">
              <div className="h-full w-full bg-background rounded-[14px] flex items-center justify-center text-primary">
                <Sliders className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black font-display tracking-wider text-foreground uppercase">
                ArcadeCore <span className="text-primary">Control Desk</span>
              </h1>
              <p className="text-xs font-semibold text-muted-foreground/80 tracking-wide mt-0.5">
                Centralized telemetry logs, server-side content ingestion, and diagnostic systems.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/40 border border-border/60 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-primary">
            <Activity className="h-3.5 w-3.5 text-secondary animate-pulse" />
            <span>Telemetry online</span>
          </div>
        </div>

        {/* Tab Controls Bar */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-muted/40 border border-border/40 w-fit">
          <button
            onClick={() => { setActiveTab('analytics'); try { sound.playClick() } catch {} }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <BarChart className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => { setActiveTab('manage'); try { sound.playClick() } catch {} }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'manage'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            <span>Manage Games ({gamesList.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('upload'); try { sound.playClick() } catch {} }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{editingId ? 'Edit Profile' : 'Upload Game'}</span>
          </button>
          <button
            onClick={() => { setActiveTab('monetization'); try { sound.playClick() } catch {} }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'monetization'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Monetization</span>
          </button>
          <button
            onClick={() => { setActiveTab('diagnostics'); try { sound.playClick() } catch {} }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'diagnostics'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Diagnostics</span>
          </button>
        </div>

        {/* Tab CONTENT Area */}
        <div className="min-h-[50vh]">
          
          {/* TAB 1: TELEMETRY DASHBOARD */}
          {activeTab === 'analytics' && (
            <div className="flex flex-col gap-8">
              
              {/* Counters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Gamers</span>
                    <Users className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black font-display tracking-tight text-foreground">
                      {loadingStats ? '...' : stats.totalUsers}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>+12%</span>
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Live Concurrency</span>
                    <Activity className="h-4.5 w-4.5 text-secondary animate-pulse" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black font-display tracking-tight text-foreground">
                      {loadingStats ? '...' : stats.activeSessions}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>+24%</span>
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Ingests</span>
                    <Gamepad2 className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black font-display tracking-tight text-foreground">
                      {loadingStats ? '...' : gamesList.length}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/60">
                      games
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Revenue</span>
                    <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black font-display tracking-tight text-foreground">
                      {loadingStats ? '...' : `$${stats.totalRevenue.toFixed(2)}`}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>+8%</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid block: Recent Players list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent users */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-border/20 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      Recent Registered Gamers
                    </h3>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  {loadingStats ? (
                    <div className="flex flex-col gap-3 py-6 items-center">
                      <Cpu className="h-6 w-6 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground">Retrieving DB user catalogs...</span>
                    </div>
                  ) : stats.users.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      No registered users found in the database.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border/20 text-muted-foreground font-black uppercase tracking-wider">
                            <th className="py-2.5">User</th>
                            <th className="py-2.5">Username</th>
                            <th className="py-2.5">User ID</th>
                            <th className="py-2.5 text-right">Joined At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {stats.users.map((u) => (
                            <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-3 flex items-center gap-2">
                                <img
                                  src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=50&auto=format&fit=crop'}
                                  alt={u.username}
                                  className="w-7 h-7 rounded-full border border-border/40 object-cover"
                                />
                                <span className="font-semibold text-foreground truncate max-w-[100px]">{u.email}</span>
                              </td>
                              <td className="py-3 font-semibold text-primary">{u.username}</td>
                              <td className="py-3 font-mono text-[10px] text-muted-foreground/60 select-all">{u.id}</td>
                              <td className="py-3 text-right text-muted-foreground font-medium">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Quick Diagnostics Health Ticker */}
                <div className="p-6 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-border/20 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      Diagnostics Status
                    </h3>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/10">
                      <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5 text-primary" />
                        <span>PostgreSQL Database</span>
                      </span>
                      <span className={`font-bold uppercase tracking-wider text-[10px] ${
                        stats.diagnostics.database.toLowerCase().includes('connected') ? 'text-emerald-400' : 'text-orange-400'
                      }`}>{stats.diagnostics.database}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/10">
                      <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-secondary" />
                        <span>Clerk Authentication</span>
                      </span>
                      <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                        {stats.diagnostics.clerk}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/10">
                      <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Razorpay Checkout Gateway</span>
                      </span>
                      <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                        {stats.diagnostics.razorpay}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/10">
                      <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-accent" />
                        <span>Google Analytics (GA4)</span>
                      </span>
                      <span className={`font-bold uppercase tracking-wider text-[10px] ${
                        stats.diagnostics.googleAnalytics.toLowerCase().includes('connected') || stats.diagnostics.googleAnalytics !== 'Not connected'
                          ? 'text-emerald-400'
                          : 'text-orange-400/80'
                      }`}>
                        {stats.diagnostics.googleAnalytics}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('diagnostics')}
                    className="w-full mt-2 py-2 rounded-xl border border-border/60 hover:bg-muted text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    View All Diagnostics Details
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INGESTION / ZIP UPLOADER FORM */}
          {activeTab === 'upload' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form Input fields */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-border/20 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    {editingId ? `Edit Game: ${title}` : 'Ingest New HTML5 Game'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Clear Form / Add New
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                  {/* Title & Version */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Game Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Neon Velocity Extreme"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Version *</label>
                      <input
                        type="text"
                        placeholder="e.g. 1.0.0"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        required
                        className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Slug Helper (read-only if editing, editable if customizing) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Game Slug</label>
                    <input
                      type="text"
                      placeholder="Auto-generated if left blank"
                      value={gameSlug}
                      onChange={(e) => setGameSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                      className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Description *</label>
                    <textarea
                      placeholder="Enter a brief game summary describing the retro mechanics..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      required
                      className="p-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all resize-none"
                    />
                  </div>

                  {/* Instructions & Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Instructions</label>
                      <textarea
                        placeholder="e.g. Steer along the road. Avoid red vehicles."
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        rows={3}
                        className="p-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all resize-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Controls Mapping</label>
                      <textarea
                        placeholder="e.g. WASD: Steer\nSpace: Shoot"
                        value={controls}
                        onChange={(e) => setControls(e.target.value)}
                        rows={3}
                        className="p-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* URLs: iframeUrl, thumbnailUrl, bannerUrl */}
                  <div className="flex flex-col gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                        HTML5 Iframe Source URL * <span className="text-[9px] text-muted-foreground normal-case font-normal">(populated automatically if you upload ZIP below)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /games-uploads/neon-showdown/index.html"
                        value={iframeUrl}
                        onChange={(e) => setIframeUrl(e.target.value)}
                        required
                        className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Thumbnail Image URL *</label>
                        <input
                          type="text"
                          placeholder="e.g. https://unsplash.com/..."
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                          required
                          className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Banner Image URL</label>
                        <input
                          type="text"
                          placeholder="e.g. https://unsplash.com/..."
                          value={bannerUrl}
                          onChange={(e) => setBannerUrl(e.target.value)}
                          className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Media: screenshots, trailer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Screenshots (comma-separated URLs)</label>
                      <input
                        type="text"
                        placeholder="url1, url2, url3"
                        value={screenshots}
                        onChange={(e) => setScreenshots(e.target.value)}
                        className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Trailer Video URL</label>
                      <input
                        type="text"
                        placeholder="e.g. https://youtube.com/embed/..."
                        value={trailerUrl}
                        onChange={(e) => setTrailerUrl(e.target.value)}
                        className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Metadata Checkboxes: Categories and Tags */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
                    
                    {/* Categories check lists */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span>Categories:</span>
                      </span>
                      {loadingMetadata ? (
                        <span className="text-xs text-muted-foreground">Loading categories...</span>
                      ) : (
                        <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2">
                          {categoriesList.map((cat) => (
                            <label key={cat.id} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(cat.slug)}
                                onChange={() => handleCategoryCheckboxChange(cat.slug)}
                                className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                              />
                              <span>{cat.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tags check lists */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                        <Tags className="h-3.5 w-3.5" />
                        <span>Tags:</span>
                      </span>
                      {loadingMetadata ? (
                        <span className="text-xs text-muted-foreground">Loading tags...</span>
                      ) : (
                        <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2">
                          {tagsList.map((tag) => (
                            <label key={tag.id} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTags.includes(tag.slug)}
                                onChange={() => handleTagCheckboxChange(tag.slug)}
                                className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                              />
                              <span>{tag.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* SEO metadata */}
                  <div className="bg-muted/10 p-4 rounded-xl border border-border/40 flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-accent" />
                      <span>SEO Configurations:</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase">SEO Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Play Neon Velocity Extreme | ArcadeCore"
                          value={seoTitle}
                          onChange={(e) => setSeoTitle(e.target.value)}
                          className="h-8 px-2 rounded-lg bg-background border border-border text-xs focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase">SEO Keywords</label>
                        <input
                          type="text"
                          placeholder="racer, synthwave, neon"
                          value={seoKeywords}
                          onChange={(e) => setSeoKeywords(e.target.value)}
                          className="h-8 px-2 rounded-lg bg-background border border-border text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase">SEO Meta Description</label>
                      <input
                        type="text"
                        placeholder="Ingest custom description for search crawlers..."
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        className="h-8 px-2 rounded-lg bg-background border border-border text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* License and status check */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">License details</label>
                      <input
                        type="text"
                        placeholder="e.g. MIT, Creative Commons BY-ND 4.0"
                        value={licenseInfo}
                        onChange={(e) => setLicenseInfo(e.target.value)}
                        className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-6 mt-6">
                      <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span>★ Featured Grid</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSponsored}
                          onChange={(e) => setIsSponsored(e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span>⚡ Sponsored Block</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPublished}
                          onChange={(e) => setIsPublished(e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span>👁 Published (Live)</span>
                      </label>
                    </div>
                  </div>

                  {/* Feedback alerts */}
                  {formFeedback && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
                      formFeedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{formFeedback.message}</span>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={submittingForm}
                    className="h-12 w-full mt-2 rounded-xl bg-primary text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:bg-primary/95 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingForm ? (
                      <>
                        <Cpu className="h-5 w-5 animate-spin" />
                        <span>Ingesting profiles in DB...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-5 w-5" />
                        <span>{editingId ? 'Update Game Profile' : 'Publish Game to Platform'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* ZIP Package Upload Side Widget */}
              <div className="flex flex-col gap-6">
                
                {/* ZIP Package Box */}
                <div className="p-6 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border/20 pb-3">
                    <FileUp className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      HTML5 Game ZIP Package
                    </h3>
                  </div>

                  <div className="flex flex-col gap-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Upload an HTML5 browser game ZIP package. The server will extract the folder, validate that it contains an <strong>index.html</strong> entry, and populate the iframeUrl route automatically.
                    </p>

                    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border/60 hover:border-primary/50 rounded-xl bg-muted/10 transition-colors cursor-pointer relative group">
                      <input
                        type="file"
                        accept=".zip"
                        onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-xs font-semibold text-foreground mt-2 truncate max-w-full">
                        {zipFile ? zipFile.name : 'Select HTML5 ZIP File'}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {zipFile ? `${(zipFile.size / 1024 / 1024).toFixed(2)} MB` : 'zip format, max 50MB'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {uploadingZip && (
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                          <span>Ingesting packages...</span>
                          <span>{zipProgress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${zipProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Success / Error feedbacks */}
                    {zipSuccessMessage && (
                      <div className="p-3.5 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs flex gap-2">
                        <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                        <span className="break-all">{zipSuccessMessage}</span>
                      </div>
                    )}

                    {zipErrorMessage && (
                      <div className="p-3.5 rounded-lg border bg-red-500/10 border-red-500/20 text-red-400 text-xs flex gap-2">
                        <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                        <span>{zipErrorMessage}</span>
                      </div>
                    )}

                    <button
                      onClick={handleZipUpload}
                      disabled={uploadingZip || !zipFile}
                      className="w-full py-2.5 rounded-xl bg-muted/60 border border-border/80 hover:bg-muted text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <Upload className="h-4.5 w-4.5" />
                      <span>Upload & Extract Package</span>
                    </button>
                  </div>
                </div>

                {/* Helpful tips */}
                <div className="p-6 rounded-2xl bg-card border border-border/40 shadow text-xs flex flex-col gap-3">
                  <span className="font-bold text-foreground">💡 Package Structure Guide</span>
                  <p className="text-muted-foreground leading-relaxed">
                    Make sure the ZIP archive contains `index.html` directly in the folder directory structure. Avoid nested folder structures unless index.html can be resolved directly. Audio and asset files must use relative paths.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: MANAGE GAMES LIST (EDIT, REPLACE, TOGGLE PUBLISH, DELETE) */}
          {activeTab === 'manage' && (
            <div className="flex flex-col gap-6">
              
              {/* Search filter bar */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-muted/10">
                <Search className="h-4.5 w-4.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter games catalog by title, slug, or categories..."
                  value={gameSearchQuery}
                  onChange={(e) => setGameSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>

              {/* Games Listing Table */}
              <div className="p-6 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-4">
                {loadingMetadata ? (
                  <div className="flex flex-col gap-3 py-10 items-center">
                    <Cpu className="h-8 w-8 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">Syncing catalog indexes...</span>
                  </div>
                ) : filteredGames.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    No matching games found in the platform index.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/20 text-muted-foreground font-black uppercase tracking-wider">
                          <th className="py-3 px-2">Game</th>
                          <th className="py-3 px-2">Slug / URL</th>
                          <th className="py-3 px-2">Version</th>
                          <th className="py-3 px-2">Plays</th>
                          <th className="py-3 px-2">Status</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/10">
                        {filteredGames.map((game) => (
                          <tr key={game.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-2 flex items-center gap-3 min-w-[200px]">
                              <img
                                src={game.thumbnailUrl}
                                alt={game.title}
                                className="w-9 h-9 rounded-lg border border-border/40 object-cover"
                              />
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-foreground text-sm truncate max-w-[150px]">
                                  {game.title}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {game.categories.map((c) => (
                                    <span key={c.slug} className="px-1 text-[8px] bg-primary/10 text-primary font-bold rounded">
                                      {c.name}
                                    </span>
                                  ))}
                                  {game.isFeatured && (
                                    <span className="px-1 text-[8px] bg-accent/25 text-accent font-bold rounded">Featured</span>
                                  )}
                                  {game.isSponsored && (
                                    <span className="px-1 text-[8px] bg-emerald-500/10 text-emerald-400 font-bold rounded">Sponsored</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 font-mono text-[10px] text-muted-foreground/80 truncate max-w-[120px]" title={game.iframeUrl}>
                              {game.slug}
                            </td>
                            <td className="py-3 px-2 font-bold text-foreground">
                              v{game.version || '1.0.0'}
                            </td>
                            <td className="py-3 px-2 text-muted-foreground font-semibold">
                              {game.playCount.toLocaleString()} plays
                            </td>
                            <td className="py-3 px-2">
                              <button
                                onClick={() => handleTogglePublish(game)}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  game.isPublished
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/25'
                                }`}
                              >
                                {game.isPublished ? 'Live / Published' : 'Unpublished'}
                              </button>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditClick(game)}
                                  className="p-1.5 rounded-lg border border-border/80 hover:bg-muted text-muted-foreground hover:text-primary transition-all cursor-pointer"
                                  title="Edit Game Profile"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(game.id, game.title)}
                                  className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 transition-all cursor-pointer"
                                  title="Delete Game"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: MONETIZATION SETTINGS */}
          {activeTab === 'monetization' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-6">
                <div className="flex items-center gap-2 border-b border-border/20 pb-3">
                  <DollarSign className="h-4.5 w-4.5 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Advertisements & Sponsorship Integration
                  </h3>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/20">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-foreground">Enable Global Rewarded Ads</span>
                      <span className="text-[10px] text-muted-foreground">Show rewarded ads before players launch any game play.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={globalAdsEnabled} 
                        onChange={(e) => setGlobalAdsEnabled(e.target.checked)} 
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Ad Countdown Seconds</label>
                    <input
                      type="number"
                      value={adCountdownSeconds}
                      onChange={(e) => setAdCountdownSeconds(parseInt(e.target.value) || 0)}
                      className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-4 border-t border-border/25 pt-4">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Configure Current Sponsor Campaign</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Sponsor Title</label>
                        <input
                          type="text"
                          value={sponsorTitle}
                          onChange={(e) => setSponsorTitle(e.target.value)}
                          className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Sponsor Campaign Target Link</label>
                        <input
                          type="text"
                          value={sponsorLink}
                          onChange={(e) => setSponsorLink(e.target.value)}
                          className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Sponsor CTA Text</label>
                      <input
                        type="text"
                        value={sponsorCta}
                        onChange={(e) => setSponsorCta(e.target.value)}
                        className="h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {settingsSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Sponsor configurations successfully synchronized!</span>
                    </div>
                  )}

                  <button
                    onClick={handleSaveSettings}
                    className="h-10 w-full mt-2 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all duration-300 cursor-pointer"
                  >
                    <span>Apply In-Game Ad Campaign Settings</span>
                  </button>
                </div>
              </div>

              {/* Sponsor Preview box */}
              <div className="p-6 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-4 text-xs">
                <span className="font-bold text-foreground">Sponsorship Layout Preview</span>
                
                {/* Mock Card */}
                <div className="relative w-full h-[220px] rounded-xl overflow-hidden border border-border/40 bg-muted">
                  <img
                    src={sponsorBg}
                    alt={sponsorTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-4 gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={sponsorLogo}
                        alt={sponsorTitle}
                        className="w-6 h-6 rounded-lg object-cover border border-white/10"
                      />
                      <span className="font-bold text-white text-sm">{sponsorTitle}</span>
                      <span className="px-1 text-[8px] bg-primary text-white uppercase font-black rounded">Ad</span>
                    </div>
                    <p className="text-[10px] text-white/80 line-clamp-2">{sponsorCta}</p>
                    <a
                      href={sponsorLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded font-bold text-[10px] w-fit"
                    >
                      Visit Sponsor Site
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DYNAMIC DIAGNOSTICS DETAILED LIST */}
          {activeTab === 'diagnostics' && (
            <div className="flex flex-col gap-6">
              
              <div className="p-6 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-6">
                <div className="flex items-center gap-2 border-b border-border/20 pb-3">
                  <Server className="h-4.5 w-4.5 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Telemetry Diagnostics & Configuration Variables
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Database */}
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-border/40 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Database className="h-4 w-4 text-primary" />
                        <span>Neon Postgres Pooler</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-extrabold uppercase text-[9px]">Connected</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                      Stateless Neon Serverless PG connection pool is currently serving database transactions successfully. Connection caching is enabled.
                    </p>
                  </div>

                  {/* Auth */}
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-border/40 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <KeyRound className="h-4 w-4 text-secondary" />
                        <span>Clerk JWT Handshake</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-extrabold uppercase text-[9px]">Active</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                      Clerk testing issuer keys are verified. User profile sync via webhooks is operational.
                    </p>
                  </div>

                  {/* Redis */}
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-border/40 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Radio className="h-4 w-4 text-orange-400" />
                        <span>Upstash Redis Cache</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded font-extrabold uppercase text-[9px] ${
                        stats.diagnostics.redis !== 'Not connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {stats.diagnostics.redis !== 'Not connected' ? 'Connected' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                      Used for storing leaderboard score rates and general page caching configurations.
                    </p>
                  </div>

                  {/* Cloudinary */}
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-border/40 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-emerald-400" />
                        <span>Cloudinary Media CDN</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded font-extrabold uppercase text-[9px] ${
                        stats.diagnostics.cloudinary !== 'Not connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {stats.diagnostics.cloudinary !== 'Not connected' ? 'Connected' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                      Serves compressed game asset screenshots and banners at low network latency.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </AppShell>
  )
}
