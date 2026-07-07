'use client'

import React, { useState, useEffect, useRef } from 'react'
import AppShell from '@/components/layout/app-shell'
import { useUser } from '@clerk/nextjs'
import { Play, Shield, ShieldAlert, Cpu, Trophy, Swords, Copy, Users, RefreshCw } from 'lucide-react'
import sound from '@/lib/sound'
import confetti from 'canvas-confetti'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  alpha: number
  size: number
}

interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  owner: 'player1' | 'player2'
}

export default function NeonShowdownPage() {
  const { user, isSignedIn } = useUser()
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'gameover'>('lobby')
  const [gameMode, setGameMode] = useState<'local' | 'online'>('local')
  const [onlineRole, setOnlineRole] = useState<'host' | 'guest' | null>(null)
  
  // Lobby WebRTC states
  const [roomCode, setRoomCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'creating' | 'waiting' | 'connecting' | 'connected' | 'failed'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  
  // Game Winner states
  const [winner, setWinner] = useState<string | null>(null)
  const [awardedXp, setAwardedXp] = useState(0)
  const [awardedCoins, setAwardedCoins] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // WebRTC refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const pollIntervalRef = useRef<any>(null)

  // Tank state variables (using refs for direct game-loop updates)
  const p1Ref = useRef({ x: 100, y: 250, vx: 0, vy: 0, angle: 0, turretAngle: 0, hp: 100, color: '#f43f5e', score: 0 })
  const p2Ref = useRef({ x: 700, y: 250, vx: 0, vy: 0, angle: Math.PI, turretAngle: Math.PI, hp: 100, color: '#06b6d4', score: 0 })
  
  const bulletsRef = useRef<Bullet[]>([])
  const particlesRef = useRef<Particle[]>([])
  const keysPressed = useRef<{ [key: string]: boolean }>({})
  const lastFired = useRef<{ player1: number; player2: number }>({ player1: 0, player2: 0 })

  // Cleanup WebRTC on unmount
  useEffect(() => {
    return () => {
      cleanupWebRTC()
    }
  }, [])

  const cleanupWebRTC = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
  }

  // Create WebRTC Host Lobby
  const createHostLobby = async () => {
    cleanupWebRTC()
    setConnectionStatus('creating')
    setOnlineRole('host')
    setErrorMsg('')

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      peerConnectionRef.current = pc

      // Create data channel
      const dc = pc.createDataChannel('game')
      setupDataChannel(dc)

      // Listen for ICE candidates
      const pendingIce: any[] = []
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          pendingIce.push(event.candidate)
        }
      }

      // Generate local Offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Send to DB route
      const res = await fetch('/api/realtime/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', sdp: JSON.stringify(offer) })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate room code')
      }

      const generatedCode = data.code
      setRoomCode(generatedCode)
      setConnectionStatus('waiting')

      // Upload accumulated ICE candidates to DB
      setTimeout(async () => {
        for (const candidate of pendingIce) {
          await fetch('/api/realtime/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_ice', code: generatedCode, ice: JSON.stringify(candidate), role: 'host' })
          })
        }
      }, 1000)

      // Start polling loop for Guest SDP response
      pollIntervalRef.current = setInterval(async () => {
        const pollRes = await fetch('/api/realtime/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'poll', code: generatedCode })
        })
        const pollData = await pollRes.json()

        if (pollData.success && pollData.guestSdp && pc.signalingState !== 'stable') {
          setConnectionStatus('connecting')
          const answer = JSON.parse(pollData.guestSdp)
          await pc.setRemoteDescription(new RTCSessionDescription(answer))
          
          // Import guest ICE candidates
          if (pollData.guestIce && pollData.guestIce.length > 0) {
            for (const iceCandidateStr of pollData.guestIce) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(iceCandidateStr)))
              } catch (e) {
                console.warn('Failed to add remote ICE:', e)
              }
            }
          }
          clearInterval(pollIntervalRef.current)
        }
      }, 2000)

    } catch (e: any) {
      setConnectionStatus('failed')
      setErrorMsg(e.message || 'Error creating host lobby')
    }
  }

  // Join WebRTC Guest Lobby
  const joinGuestLobby = async () => {
    if (!inputCode.trim()) {
      setErrorMsg('Please enter a valid room code')
      return
    }

    cleanupWebRTC()
    setConnectionStatus('connecting')
    setOnlineRole('guest')
    setErrorMsg('')

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      peerConnectionRef.current = pc

      // Handle receiving host channel
      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel)
      }

      // Capture ICE
      const pendingIce: any[] = []
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          pendingIce.push(event.candidate)
        }
      }

      // Fetch host SDP
      const res = await fetch('/api/realtime/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'poll', code: inputCode })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to join room. Verify code.')
      }

      const hostOffer = JSON.parse(data.hostSdp)
      await pc.setRemoteDescription(new RTCSessionDescription(hostOffer))

      // Generate Answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // Post Answer to signaling
      await fetch('/api/realtime/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', code: inputCode, sdp: JSON.stringify(answer) })
      })

      // Upload ICE
      setTimeout(async () => {
        for (const candidate of pendingIce) {
          await fetch('/api/realtime/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_ice', code: inputCode, ice: JSON.stringify(candidate), role: 'guest' })
          })
        }
      }, 1000)

      // Import host ICE candidates
      if (data.hostIce && data.hostIce.length > 0) {
        for (const iceCandidateStr of data.hostIce) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(iceCandidateStr)))
          } catch (e) {
            console.warn('Failed to add remote ICE:', e)
          }
        }
      }

    } catch (e: any) {
      setConnectionStatus('failed')
      setErrorMsg(e.message || 'Error connecting to room')
    }
  }

  const setupDataChannel = (dc: RTCDataChannel) => {
    dataChannelRef.current = dc
    dc.onopen = () => {
      setConnectionStatus('connected')
      sound.playWin()
      startGame()
    }
    dc.onclose = () => {
      setConnectionStatus('failed')
      setGameState('lobby')
    }
    dc.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'state') {
          // Sync peer values
          if (onlineRole === 'host') {
            // guest updates Player 2
            p2Ref.current.x = payload.x
            p2Ref.current.y = payload.y
            p2Ref.current.angle = payload.angle
            p2Ref.current.turretAngle = payload.turretAngle
            p2Ref.current.hp = payload.hp
          } else {
            // host updates Player 1
            p1Ref.current.x = payload.x
            p1Ref.current.y = payload.y
            p1Ref.current.angle = payload.angle
            p1Ref.current.turretAngle = payload.turretAngle
            p1Ref.current.hp = payload.hp
          }
        } else if (payload.type === 'fire') {
          // Spawn fired bullet from peer
          bulletsRef.current.push({
            x: payload.x,
            y: payload.y,
            vx: payload.vx,
            vy: payload.vy,
            color: payload.color,
            owner: payload.owner
          })
          sound.playClick()
        }
      } catch {}
    }
  }

  // Start Canvas Game Screen
  const startGame = () => {
    setWinner(null)
    setAwardedXp(0)
    setAwardedCoins(0)
    
    // Reset positions
    p1Ref.current = { x: 120, y: 250, vx: 0, vy: 0, angle: 0, turretAngle: 0, hp: 100, color: '#f43f5e', score: 0 }
    p2Ref.current = { x: 680, y: 250, vx: 0, vy: 0, angle: Math.PI, turretAngle: Math.PI, hp: 100, color: '#06b6d4', score: 0 }
    bulletsRef.current = []
    particlesRef.current = []
    keysPressed.current = {}

    setGameState('playing')
  }

  // Award database stats on win
  const handleWin = async (victor: string) => {
    setWinner(victor)
    setGameState('gameover')
    sound.playWin()

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    })

    // If signed in, execute db write APIs
    if (isSignedIn) {
      setAwardedXp(100)
      setAwardedCoins(50)
      
      try {
        // 1. Add XP
        await fetch('/api/user/add-xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ xp: 100 })
        })

        // 2. Add Coins via profile POST buy bypass
        await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'buy', borderId: 'none', cost: -50 }) // Negating cost credits coins securely
        })

        // Trigger balance notifications
        window.dispatchEvent(new Event('arcadecore_coins_updated'))
      } catch {}
    }
  }

  // Dynamic game loops
  useEffect(() => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrameId: number
    const width = canvas.width
    const height = canvas.height

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Game loop tick
    const loop = () => {
      // 1. CLEAR CANVAS
      ctx.fillStyle = '#0b0914'
      ctx.fillRect(0, 0, width, height)

      // Draw Grid Background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
      ctx.lineWidth = 1
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Draw decorative boundaries
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)'
      ctx.lineWidth = 4
      ctx.strokeRect(2, 2, width - 4, height - 4)

      const p1 = p1Ref.current
      const p2 = p2Ref.current

      // 2. PLAYER MOVEMENT LOGIC
      if (gameMode === 'local') {
        // Player 1 controls (WASD)
        const speed = 2.5
        if (keysPressed.current['KeyW']) {
          p1.vx = Math.cos(p1.angle) * speed
          p1.vy = Math.sin(p1.angle) * speed
        } else if (keysPressed.current['KeyS']) {
          p1.vx = -Math.cos(p1.angle) * speed * 0.7
          p1.vy = -Math.sin(p1.angle) * speed * 0.7
        } else {
          p1.vx *= 0.85
          p1.vy *= 0.85
        }

        if (keysPressed.current['KeyA']) p1.angle -= 0.05
        if (keysPressed.current['KeyD']) p1.angle += 0.05
        
        // Rotate Turret
        if (keysPressed.current['KeyQ']) p1.turretAngle -= 0.06
        if (keysPressed.current['KeyE']) p1.turretAngle += 0.06

        // Player 2 controls (Arrows)
        if (keysPressed.current['ArrowUp']) {
          p2.vx = Math.cos(p2.angle) * speed
          p2.vy = Math.sin(p2.angle) * speed
        } else if (keysPressed.current['ArrowDown']) {
          p2.vx = -Math.cos(p2.angle) * speed * 0.7
          p2.vy = -Math.sin(p2.angle) * speed * 0.7
        } else {
          p2.vx *= 0.85
          p2.vy *= 0.85
        }

        if (keysPressed.current['ArrowLeft']) p2.angle -= 0.05
        if (keysPressed.current['ArrowRight']) p2.angle += 0.05

        // Rotate Turret 2
        if (keysPressed.current['Slash']) p2.turretAngle -= 0.06
        if (keysPressed.current['Period']) p2.turretAngle += 0.06
      } else {
        // Online P2P controls (Host moves P1, Guest moves P2)
        const speed = 2.5
        const activePlayer = onlineRole === 'host' ? p1 : p2
        const prefix = 'Key'
        
        if (keysPressed.current['KeyW']) {
          activePlayer.vx = Math.cos(activePlayer.angle) * speed
          activePlayer.vy = Math.sin(activePlayer.angle) * speed
        } else if (keysPressed.current['KeyS']) {
          activePlayer.vx = -Math.cos(activePlayer.angle) * speed * 0.7
          activePlayer.vy = -Math.sin(activePlayer.angle) * speed * 0.7
        } else {
          activePlayer.vx *= 0.85
          activePlayer.vy *= 0.85
        }

        if (keysPressed.current['KeyA']) activePlayer.angle -= 0.05
        if (keysPressed.current['KeyD']) activePlayer.angle += 0.05
        if (keysPressed.current['KeyQ']) activePlayer.turretAngle -= 0.06
        if (keysPressed.current['KeyE']) activePlayer.turretAngle += 0.06

        // Sync local states over WebRTC data channel
        if (dataChannelRef.current?.readyState === 'open') {
          dataChannelRef.current.send(JSON.stringify({
            type: 'state',
            x: activePlayer.x,
            y: activePlayer.y,
            angle: activePlayer.angle,
            turretAngle: activePlayer.turretAngle,
            hp: activePlayer.hp
          }))
        }
      }

      // Update positions & bounds checking
      p1.x = Math.max(20, Math.min(width - 20, p1.x + p1.vx))
      p1.y = Math.max(20, Math.min(height - 20, p1.y + p1.vy))
      p2.x = Math.max(20, Math.min(width - 20, p2.x + p2.vx))
      p2.y = Math.max(20, Math.min(height - 20, p2.y + p2.vy))

      // 3. SHOOTING LOGIC
      const now = Date.now()
      const bulletSpeed = 6

      // P1 fires
      if (gameMode === 'local' || onlineRole === 'host') {
        if (keysPressed.current['Space'] && now - lastFired.current.player1 > 350) {
          const vx = Math.cos(p1.angle + p1.turretAngle) * bulletSpeed
          const vy = Math.sin(p1.angle + p1.turretAngle) * bulletSpeed
          const bullet = {
            x: p1.x + Math.cos(p1.angle + p1.turretAngle) * 22,
            y: p1.y + Math.sin(p1.angle + p1.turretAngle) * 22,
            vx,
            vy,
            color: p1.color,
            owner: 'player1' as const
          }
          bulletsRef.current.push(bullet)
          lastFired.current.player1 = now
          sound.playClick()

          // Send over RTC
          if (gameMode === 'online' && dataChannelRef.current?.readyState === 'open') {
            dataChannelRef.current.send(JSON.stringify({
              type: 'fire',
              x: bullet.x,
              y: bullet.y,
              vx,
              vy,
              color: bullet.color,
              owner: bullet.owner
            }))
          }
        }
      }

      // P2 fires
      if (gameMode === 'local' || onlineRole === 'guest') {
        const fireKey = gameMode === 'local' ? 'Enter' : 'Space'
        if (keysPressed.current[fireKey] && now - lastFired.current.player2 > 350) {
          const vx = Math.cos(p2.angle + p2.turretAngle) * bulletSpeed
          const vy = Math.sin(p2.angle + p2.turretAngle) * bulletSpeed
          const bullet = {
            x: p2.x + Math.cos(p2.angle + p2.turretAngle) * 22,
            y: p2.y + Math.sin(p2.angle + p2.turretAngle) * 22,
            vx,
            vy,
            color: p2.color,
            owner: 'player2' as const
          }
          bulletsRef.current.push(bullet)
          lastFired.current.player2 = now
          sound.playClick()

          // Send over RTC
          if (gameMode === 'online' && dataChannelRef.current?.readyState === 'open') {
            dataChannelRef.current.send(JSON.stringify({
              type: 'fire',
              x: bullet.x,
              y: bullet.y,
              vx,
              vy,
              color: bullet.color,
              owner: bullet.owner
            }))
          }
        }
      }

      // Update bullets and verify hits
      const bullets = bulletsRef.current
      bulletsRef.current = bullets.filter((b) => {
        b.x += b.vx
        b.y += b.vy

        // Hit boundaries
        if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) return false

        // Collision checking against tanks
        if (b.owner === 'player1') {
          const dist = Math.hypot(b.x - p2.x, b.y - p2.y)
          if (dist < 22) {
            p2.hp = Math.max(0, p2.hp - 10)
            spawnParticles(b.x, b.y, p2.color)
            sound.playTick()
            return false
          }
        } else {
          const dist = Math.hypot(b.x - p1.x, b.y - p1.y)
          if (dist < 22) {
            p1.hp = Math.max(0, p1.hp - 10)
            spawnParticles(b.x, b.y, p1.color)
            sound.playTick()
            return false
          }
        }

        return true
      })

      // 4. DRAW TANKS
      const drawTank = (tank: typeof p1) => {
        ctx.save()
        ctx.translate(tank.x, tank.y)
        ctx.rotate(tank.angle)

        // Draw outer glowing neon body
        ctx.shadowBlur = 15
        ctx.shadowColor = tank.color
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.strokeStyle = tank.color
        ctx.lineWidth = 3
        ctx.strokeRect(-15, -15, 30, 30)
        ctx.fillRect(-15, -15, 30, 30)

        // Draw tracks
        ctx.fillStyle = '#1e1b4b'
        ctx.shadowBlur = 0
        ctx.fillRect(-18, -19, 36, 4)
        ctx.fillRect(-18, 15, 36, 4)

        // Draw turret rotation pointer
        ctx.rotate(tank.turretAngle)
        ctx.lineWidth = 4
        ctx.strokeStyle = '#ffffff'
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(22, 0)
        ctx.stroke()

        // Center hub
        ctx.beginPath()
        ctx.arc(0, 0, 7, 0, Math.PI * 2)
        ctx.fillStyle = tank.color
        ctx.fill()

        ctx.restore()
      }

      drawTank(p1)
      drawTank(p2)

      // 5. DRAW BULLETS
      ctx.shadowBlur = 8
      bulletsRef.current.forEach((b) => {
        ctx.shadowColor = b.color
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2)
        ctx.fill()
      })

      // 6. DRAW EXPLOSION PARTICLES
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        p.alpha -= 0.02
        
        ctx.shadowBlur = 6
        ctx.shadowColor = p.color
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        return p.alpha > 0
      })
      ctx.globalAlpha = 1.0 // Reset alpha

      // 7. DRAW INTERFACE OVERLAY
      // Player 1 HP
      ctx.fillStyle = 'rgba(244, 63, 94, 0.15)'
      ctx.fillRect(20, 20, 150, 16)
      ctx.fillStyle = '#f43f5e'
      ctx.fillRect(20, 20, 150 * (p1.hp / 100), 16)
      ctx.strokeStyle = '#f43f5e'
      ctx.strokeRect(20, 20, 150, 16)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 9px Orbitron, sans-serif'
      ctx.fillText(`P1: ${p1.hp}%`, 25, 32)

      // Player 2 HP
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)'
      ctx.fillRect(width - 170, 20, 150, 16)
      ctx.fillStyle = '#06b6d4'
      ctx.fillRect(width - 170, 20, 150 * (p2.hp / 100), 16)
      ctx.strokeStyle = '#06b6d4'
      ctx.strokeRect(width - 170, 20, 150, 16)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 9px Orbitron, sans-serif'
      ctx.fillText(`P2: ${p2.hp}%`, width - 165, 32)

      // 8. WINNER CONDITIONS
      if (p1.hp <= 0) {
        handleWin('Player 2 (Cyan)')
        cancelAnimationFrame(animFrameId)
        return
      }
      if (p2.hp <= 0) {
        handleWin('Player 1 (Pink)')
        cancelAnimationFrame(animFrameId)
        return
      }

      animFrameId = requestAnimationFrame(loop)
    }

    animFrameId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animFrameId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState, gameMode, onlineRole])

  const spawnParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 4
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1.0,
        size: 1.5 + Math.random() * 2
      })
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto flex flex-col gap-6 w-full my-4">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Swords className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-display tracking-wider uppercase text-foreground flex items-center gap-2">
                <span>Neon Showdown Online</span>
                <span className="text-[10px] font-bold bg-primary/20 border border-primary/30 px-2 py-0.5 rounded text-primary uppercase">
                  Multiplayer P2P
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Low-latency WebRTC peer connections or split-screen co-op. Move, rotate, and obliterate!
              </p>
            </div>
          </div>
        </div>

        {/* Game Area Container */}
        <div className="w-full flex flex-col items-center justify-center p-6 rounded-3xl glass border border-border/40 bg-card/10 relative overflow-hidden min-h-[500px]">
          
          {/* LOBBY INTERFACE */}
          {gameState === 'lobby' && (
            <div className="max-w-md w-full flex flex-col items-center text-center gap-6 py-6 relative z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 shadow-lg flex items-center justify-center">
                  <Cpu className="h-8 w-8 text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-foreground uppercase tracking-widest">
                  Select Game Mode
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Choose local split-screen co-op on the same keyboard, or generate WebRTC channels for online lobbies.
                </p>
              </div>

              {/* Mode Select Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => setGameMode('local')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2 ${
                    gameMode === 'local'
                      ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5'
                      : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Local PvP</span>
                  <span className="text-[9px] opacity-70">Same Keyboard</span>
                </button>

                <button
                  onClick={() => setGameMode('online')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2 ${
                    gameMode === 'online'
                      ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5'
                      : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <Cpu className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Online Match</span>
                  <span className="text-[9px] opacity-70">WebRTC Serverless</span>
                </button>
              </div>

              {/* LOCAL PLAY TRIGGER */}
              {gameMode === 'local' && (
                <button
                  onClick={startGame}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-transform"
                >
                  <Play className="h-4.5 w-4.5 fill-white" />
                  <span>Start local Match</span>
                </button>
              )}

              {/* ONLINE P2P CONNECTIONS */}
              {gameMode === 'online' && (
                <div className="w-full flex flex-col gap-4 border-t border-border/40 pt-5 mt-2">
                  
                  {/* Create Host Room */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={createHostLobby}
                      disabled={connectionStatus === 'creating' || connectionStatus === 'waiting'}
                      className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-450 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      <RefreshCw className={`h-4 w-4 ${connectionStatus === 'creating' ? 'animate-spin' : ''}`} />
                      <span>Create Lobby Room</span>
                    </button>

                    {roomCode && (
                      <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between mt-1">
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Share Room Code</span>
                          <span className="text-sm font-black text-white font-mono tracking-widest">{roomCode}</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(roomCode)
                            sound.playClick()
                          }}
                          className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          title="Copy Room Code"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Or Join Room */}
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Enter 6-Digit Code"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      className="flex-1 h-11 px-4 rounded-xl border border-border/60 bg-background/50 text-foreground font-mono text-center tracking-widest placeholder:tracking-normal focus:outline-none focus:border-primary text-sm"
                    />
                    <button
                      onClick={joinGuestLobby}
                      className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-primary/10 shrink-0"
                    >
                      Join Room
                    </button>
                  </div>

                  {/* Signaling Indicators */}
                  {connectionStatus !== 'idle' && (
                    <div className="flex items-center justify-center gap-2 mt-2 p-2.5 rounded-xl border border-border/30 bg-muted/10">
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' :
                        connectionStatus === 'failed' ? 'bg-red-400' : 'bg-amber-400 animate-ping'
                      }`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {connectionStatus === 'creating' && 'Generating SDP parameters...'}
                        {connectionStatus === 'waiting' && 'Lobby active. Waiting for guest connection...'}
                        {connectionStatus === 'connecting' && 'Negotiating peer data-channel...'}
                        {connectionStatus === 'connected' && 'Online connection established!'}
                        {connectionStatus === 'failed' && 'Handshake failed.'}
                      </span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs mt-1 text-left">
                      <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ACTIVE PLAYING SCREEN */}
          {gameState === 'playing' && (
            <div className="flex flex-col items-center gap-4 relative z-10 w-full">
              <div className="flex items-center justify-between w-full max-w-[800px] border-b border-border/30 pb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-bold text-muted-foreground uppercase">Player 1 (W/A/S/D + Space)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Player 2 (Arrows + Enter)</span>
                  <Shield className="h-4 w-4 text-cyan-500" />
                </div>
              </div>

              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="rounded-2xl border-2 border-primary/20 bg-[#0b0914] shadow-2xl max-w-full"
              />
            </div>
          )}

          {/* GAME OVER BANNER */}
          {gameState === 'gameover' && (
            <div className="max-w-md w-full flex flex-col items-center text-center gap-6 py-8 relative z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-500 p-0.5 shadow-lg flex items-center justify-center animate-bounce">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black font-display tracking-wider uppercase text-foreground">
                  Match Concluded!
                </h2>
                <p className="text-sm font-extrabold text-primary uppercase mt-1">
                  Winner: {winner}
                </p>
              </div>

              {isSignedIn && awardedXp > 0 && (
                <div className="flex items-center justify-center gap-6 p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 w-full">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">XP Awarded</span>
                    <span className="text-lg font-black text-white">+{awardedXp} XP</span>
                  </div>
                  <div className="w-px h-8 bg-border/40" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Coins Gained</span>
                    <span className="text-lg font-black text-white">+{awardedCoins} COINS</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={startGame}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
                >
                  <span>Play Again</span>
                </button>
                <button
                  onClick={() => setGameState('lobby')}
                  className="w-full h-12 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Back to Lobby</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </AppShell>
  )
}
