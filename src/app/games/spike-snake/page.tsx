'use client'

import React, { useState, useEffect, useRef } from 'react'
import AppShell from '@/components/layout/app-shell'
import { Gamepad2, Users, Trophy, Play, ArrowLeft, Send, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import confetti from 'canvas-confetti'
import { sound } from '@/lib/sound'

interface SnakeSegment {
  x: number
  y: number
}

interface FoodPellet {
  id: string
  x: number
  y: number
  color: string
  value: number
}

interface Skin {
  id: string
  name: string
  color: string
  glowColor: string
}

const SKINS: Skin[] = [
  { id: 'classic-green', name: 'Classic Green', color: '#22c55e', glowColor: 'rgba(34,197,94,0.6)' },
  { id: 'retro-pink', name: 'Neon Retro Pink', color: '#ec4899', glowColor: 'rgba(236,72,153,0.6)' },
  { id: 'cyan-hacker', name: 'Cyan Hacker', color: '#06b6d4', glowColor: 'rgba(6,182,212,0.6)' },
  { id: 'gold-champion', name: 'Cosmic Gold', color: '#eab308', glowColor: 'rgba(234,179,8,0.6)' }
]

export default function SpikeSnakeGame() {
  const { user, isSignedIn } = useUser()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Game Setup States
  const [activeMode, setActiveMode] = useState<'lobby' | 'single' | 'local' | 'online_lobby' | 'playing'>('lobby')
  const [selectedSkin, setSelectedSkin] = useState<Skin>(SKINS[0])
  const [score, setScore] = useState(0)
  const [rivalScore, setRivalScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [winnerMessage, setWinnerMessage] = useState('')

  // WebRTC Lobby States
  const [onlineRole, setOnlineRole] = useState<'host' | 'guest' | null>(null)
  const [roomCode, setRoomCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'creating' | 'waiting' | 'connecting' | 'connected' | 'failed'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  
  // Chat States
  const [chatLog, setChatLog] = useState<string[]>([])
  const [chatInput, setChatInput] = useState('')

  // WebRTC references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const pollIntervalRef = useRef<any>(null)

  // Game Engine references
  const gameLoopRef = useRef<number | null>(null)
  const keysPressedRef = useRef<{ [key: string]: boolean }>({})
  const gameSubModeRef = useRef<'single' | 'local' | 'online'>('single')

  // Game Entities (ref-based for instant access in canvas loop)
  const snake1Ref = useRef<SnakeSegment[]>([])
  const angle1Ref = useRef<number>(0)
  const targetAngle1Ref = useRef<number>(0)
  const speed1Ref = useRef<number>(3)

  const snake2Ref = useRef<SnakeSegment[]>([])
  const angle2Ref = useRef<number>(0)
  const targetAngle2Ref = useRef<number>(0)
  const speed2Ref = useRef<number>(3)

  const aiSnakesRef = useRef<{ id: string; name: string; color: string; segments: SnakeSegment[]; angle: number; speed: number }[]>([])
  const foodRef = useRef<FoodPellet[]>([])
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; alpha: number; size: number }[]>([])

  // Setup canvas size & inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      cleanupWebRTC()
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [])

  // WebRTC data channel message parsing
  const setupDataChannel = (channel: RTCDataChannel) => {
    dataChannelRef.current = channel
    channel.onopen = () => {
      setConnectionStatus('connected')
      setChatLog((prev) => [...prev, 'System: P2P Match Connection Established!'])
      try { sound.playTick() } catch {}
      
      // If host, start the game immediately
      if (onlineRole === 'host') {
        setTimeout(() => {
          startGame('online')
        }, 1000)
      }
    }
    channel.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'chat') {
          setChatLog((prev) => [...prev, msg.text])
          try { sound.playClick() } catch {}
        } else if (msg.type === 'start') {
          setActiveMode('playing')
          setGameOver(false)
          setWinnerMessage('')
        } else if (msg.type === 'snake') {
          // Received guest snake position
          snake2Ref.current = msg.segments
          angle2Ref.current = msg.angle
        } else if (msg.type === 'sync') {
          // Guest receives full host state sync
          snake1Ref.current = msg.hostSnake
          angle1Ref.current = msg.hostAngle
          foodRef.current = msg.food
          // Sync score
          setScore(msg.guestScore)
          setRivalScore(msg.hostScore)
        } else if (msg.type === 'gameover') {
          setGameOver(true)
          setWinnerMessage(msg.winner)
        }
      } catch {}
    }
  }

  const cleanupWebRTC = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    setConnectionStatus('idle')
    setRoomCode('')
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

      const dc = pc.createDataChannel('snake-chat')
      setupDataChannel(dc)

      pc.onicecandidate = (event) => {
        if (event.candidate && roomCode) {
          fetch('/api/realtime/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_ice', code: roomCode, ice: JSON.stringify(event.candidate), role: 'host' })
          }).catch(() => {})
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

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

      // Listen for ICE candidates again with the newly generated code
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/realtime/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_ice', code: generatedCode, ice: JSON.stringify(event.candidate), role: 'host' })
          }).catch(() => {})
        }
      }

      const polledGuestIce = new Set<string>()
      pollIntervalRef.current = setInterval(async () => {
        const pollRes = await fetch('/api/realtime/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'poll', code: generatedCode })
        })
        const pollData = await pollRes.json()

        if (pollData.success) {
          if (pollData.guestSdp && pc.signalingState !== 'stable') {
            setConnectionStatus('connecting')
            const answer = JSON.parse(pollData.guestSdp)
            await pc.setRemoteDescription(new RTCSessionDescription(answer))
          }
          
          if (pollData.guestIce && pollData.guestIce.length > 0) {
            for (const iceCandidateStr of pollData.guestIce) {
              if (!polledGuestIce.has(iceCandidateStr)) {
                polledGuestIce.add(iceCandidateStr)
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(iceCandidateStr)))
                } catch (e) {
                  console.warn('Failed to add remote ICE:', e)
                }
              }
            }
          }
        }
      }, 1500)

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

      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel)
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/realtime/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_ice', code: inputCode, ice: JSON.stringify(event.candidate), role: 'guest' })
          }).catch(() => {})
        }
      }

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

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      await fetch('/api/realtime/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', code: inputCode, sdp: JSON.stringify(answer) })
      })

      const polledHostIce = new Set<string>()
      pollIntervalRef.current = setInterval(async () => {
        const pollRes = await fetch('/api/realtime/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'poll', code: inputCode })
        })
        const pollData = await pollRes.json()

        if (pollData.success && pollData.hostIce && pollData.hostIce.length > 0) {
          for (const iceCandidateStr of pollData.hostIce) {
            if (!polledHostIce.has(iceCandidateStr)) {
              polledHostIce.add(iceCandidateStr)
              try {
                await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(iceCandidateStr)))
              } catch (e) {
                console.warn('Failed to add remote ICE:', e)
              }
            }
          }
        }
      }, 1500)

    } catch (e: any) {
      setConnectionStatus('failed')
      setErrorMsg(e.message || 'Error connecting to room')
    }
  }

  // Send lobby chat
  const sendLobbyChat = () => {
    if (!chatInput.trim()) return
    const msg = `${user?.username || 'Player'}: ${chatInput}`
    
    setChatLog((prev) => [...prev, msg])
    if (dataChannelRef.current?.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify({ type: 'chat', text: msg }))
    }
    setChatInput('')
  }

  // Generate starting entities
  const generateStartingSnakes = () => {
    // P1
    snake1Ref.current = []
    const startX1 = 200, startY1 = 300
    for (let i = 0; i < 15; i++) {
      snake1Ref.current.push({ x: startX1 - i * 8, y: startY1 })
    }
    angle1Ref.current = 0
    targetAngle1Ref.current = 0
    speed1Ref.current = 3

    // P2 / Rival
    snake2Ref.current = []
    const startX2 = 600, startY2 = 300
    for (let i = 0; i < 15; i++) {
      snake2Ref.current.push({ x: startX2 + i * 8, y: startY2 })
    }
    angle2Ref.current = Math.PI
    targetAngle2Ref.current = Math.PI
    speed2Ref.current = 3

    // AI
    aiSnakesRef.current = []
    if (activeMode === 'single') {
      const colors = ['#a855f7', '#f43f5e', '#3b82f6']
      for (let k = 0; k < 3; k++) {
        const startX = 100 + Math.random() * 600
        const startY = 100 + Math.random() * 400
        const segments: SnakeSegment[] = []
        for (let i = 0; i < 12; i++) {
          segments.push({ x: startX, y: startY })
        }
        aiSnakesRef.current.push({
          id: `ai-${k}`,
          name: `AI Slasher ${k + 1}`,
          color: colors[k],
          segments,
          angle: Math.random() * Math.PI * 2,
          speed: 2.2
        })
      }
    }

    // Food
    foodRef.current = []
    const colors = ['#22c55e', '#ec4899', '#06b6d4', '#eab308', '#a855f7']
    for (let i = 0; i < 40; i++) {
      foodRef.current.push({
        id: `food-${i}`,
        x: Math.random() * 1200,
        y: Math.random() * 800,
        color: colors[Math.floor(Math.random() * colors.length)],
        value: 1
      })
    }

    particlesRef.current = []
  }

  // Claim Reward database handler
  const claimCoinReward = async () => {
    if (!isSignedIn) return
    try {
      await fetch('/api/user/add-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp: 100 })
      })
      await fetch('/api/user/claim-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardType: '50 XP', amount: 50 })
      })
    } catch {}
  }

  // Start the actual game loop
  const startGame = (mode: 'single' | 'local' | 'online') => {
    gameSubModeRef.current = mode
    generateStartingSnakes()
    setGameOver(false)
    setWinnerMessage('')
    setScore(15)
    setRivalScore(15)

    if (mode === 'online' && onlineRole === 'host') {
      if (dataChannelRef.current?.readyState === 'open') {
        dataChannelRef.current.send(JSON.stringify({ type: 'start' }))
      }
    }

    setActiveMode('playing')
    try { sound.playTick() } catch {}

    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }

  // Game Loop logic
  const gameLoop = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clean viewport
    ctx.fillStyle = '#09090b'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 1. Draw Hexagonal Grid background
    ctx.strokeStyle = '#18181b'
    ctx.lineWidth = 1
    const size = 30
    for (let y = 0; y < canvas.height; y += size * 1.5) {
      for (let x = 0; x < canvas.width; x += size * Math.sqrt(3)) {
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3
          ctx.lineTo(
            x + (y % (size * 3) === 0 ? 0 : (size * Math.sqrt(3)) / 2) + size * Math.cos(angle),
            y + size * Math.sin(angle)
          )
        }
        ctx.closePath()
        ctx.stroke()
      }
    }

    // 2. Steer Player 1
    const head1 = snake1Ref.current[0]
    if (head1) {
      // Local or Host keyboard steer
      if (activeMode === 'playing') {
        if (keysPressedRef.current['a'] || keysPressedRef.current['A']) targetAngle1Ref.current -= 0.08
        if (keysPressedRef.current['d'] || keysPressedRef.current['D']) targetAngle1Ref.current += 0.08
        
        // Speed boost
        if (keysPressedRef.current[' ']) {
          speed1Ref.current = 5.2
          // spawn trail particles
          if (Math.random() < 0.3) {
            particlesRef.current.push({
              x: head1.x,
              y: head1.y,
              vx: -Math.cos(angle1Ref.current) * 2,
              vy: -Math.sin(angle1Ref.current) * 2,
              color: selectedSkin.color,
              alpha: 1,
              size: Math.random() * 3 + 1
            })
          }
        } else {
          speed1Ref.current = 3.2
        }
      }

      // Smooth interpolation to target angle
      angle1Ref.current += (targetAngle1Ref.current - angle1Ref.current) * 0.2
      
      // Move snake 1 segments
      const nextX = head1.x + Math.cos(angle1Ref.current) * speed1Ref.current
      const nextY = head1.y + Math.sin(angle1Ref.current) * speed1Ref.current
      
      // Boundary wraps
      const wrappedX = (nextX + canvas.width) % canvas.width
      const wrappedY = (nextY + canvas.height) % canvas.height

      const newSegments = [{ x: wrappedX, y: wrappedY }, ...snake1Ref.current.slice(0, -1)]
      snake1Ref.current = newSegments
    }

    // 3. Steer Player 2 (Local PvP)
    if (activeMode === 'playing' && gameSubModeRef.current === 'local') {
      // Offline local split keys
      const head2 = snake2Ref.current[0]
      if (head2) {
        if (keysPressedRef.current['ArrowLeft']) targetAngle2Ref.current -= 0.08
        if (keysPressedRef.current['ArrowRight']) targetAngle2Ref.current += 0.08
        
        if (keysPressedRef.current['Enter']) {
          speed2Ref.current = 5.2
        } else {
          speed2Ref.current = 3.2
        }

        angle2Ref.current += (targetAngle2Ref.current - angle2Ref.current) * 0.2
        const nextX2 = head2.x + Math.cos(angle2Ref.current) * speed2Ref.current
        const nextY2 = head2.y + Math.sin(angle2Ref.current) * speed2Ref.current
        
        const wrappedX2 = (nextX2 + canvas.width) % canvas.width
        const wrappedY2 = (nextY2 + canvas.height) % canvas.height

        const newSegments2 = [{ x: wrappedX2, y: wrappedY2 }, ...snake2Ref.current.slice(0, -1)]
        snake2Ref.current = newSegments2
      }
    }

    // 4. Update WebRTC online game state
    if (connectionStatus === 'connected') {
      if (onlineRole === 'host') {
        // Host coordinates food and calculates crashes, then broadcasts sync
        if (dataChannelRef.current?.readyState === 'open') {
          dataChannelRef.current.send(JSON.stringify({
            type: 'sync',
            hostSnake: snake1Ref.current,
            hostAngle: angle1Ref.current,
            food: foodRef.current,
            hostScore: snake1Ref.current.length,
            guestScore: snake2Ref.current.length
          }))
        }
      } else {
        // Guest sends its head updates
        if (dataChannelRef.current?.readyState === 'open') {
          dataChannelRef.current.send(JSON.stringify({
            type: 'snake',
            segments: snake2Ref.current,
            angle: angle2Ref.current
          }))
        }
        
        // Guest locally steers its own snake2
        const head2 = snake2Ref.current[0]
        if (head2) {
          if (keysPressedRef.current['a'] || keysPressedRef.current['A']) targetAngle2Ref.current -= 0.08
          if (keysPressedRef.current['d'] || keysPressedRef.current['D']) targetAngle2Ref.current += 0.08
          
          angle2Ref.current += (targetAngle2Ref.current - angle2Ref.current) * 0.2
          const nextX2 = head2.x + Math.cos(angle2Ref.current) * speed2Ref.current
          const nextY2 = head2.y + Math.sin(angle2Ref.current) * speed2Ref.current
          
          const wrappedX2 = (nextX2 + canvas.width) % canvas.width
          const wrappedY2 = (nextY2 + canvas.height) % canvas.height

          const newSegments2 = [{ x: wrappedX2, y: wrappedY2 }, ...snake2Ref.current.slice(0, -1)]
          snake2Ref.current = newSegments2
        }
      }
    }

    // 5. Update AI Snakes (Single Player Mode)
    if (activeMode === 'playing' && aiSnakesRef.current.length > 0) {
      aiSnakesRef.current.forEach((ai) => {
        const head = ai.segments[0]
        if (!head) return

        // Dumb AI targeting closest food
        let closestFood = foodRef.current[0]
        let minDist = 9999
        foodRef.current.forEach((f) => {
          const d = Math.hypot(f.x - head.x, f.y - head.y)
          if (d < minDist) {
            minDist = d
            closestFood = f
          }
        })

        if (closestFood) {
          const targetAngle = Math.atan2(closestFood.y - head.y, closestFood.x - head.x)
          ai.angle += (targetAngle - ai.angle) * 0.12
        }

        const nextX = head.x + Math.cos(ai.angle) * ai.speed
        const nextY = head.y + Math.sin(ai.angle) * ai.speed
        
        const wrappedX = (nextX + canvas.width) % canvas.width
        const wrappedY = (nextY + canvas.height) % canvas.height

        ai.segments = [{ x: wrappedX, y: wrappedY }, ...ai.segments.slice(0, -1)]
      })
    }

    // 6. Food Collisions (calculated on host or locally in offline)
    const canManageFood = connectionStatus !== 'connected' || onlineRole === 'host'
    if (canManageFood) {
      // check P1 eating
      const h1 = snake1Ref.current[0]
      if (h1) {
        foodRef.current.forEach((f, idx) => {
          if (Math.hypot(f.x - h1.x, f.y - h1.y) < 18) {
            // Eat food
            try { sound.playClick() } catch {}
            // Grow snake
            snake1Ref.current.push({ ...snake1Ref.current[snake1Ref.current.length - 1] })
            setScore(snake1Ref.current.length)

            // Emit particles
            for (let i = 0; i < 5; i++) {
              particlesRef.current.push({
                x: f.x,
                y: f.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: f.color,
                alpha: 1,
                size: Math.random() * 4 + 2
              })
            }

            // Respawn food
            foodRef.current[idx] = {
              id: f.id,
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              color: f.color,
              value: 1
            }
          }
        })
      }

      // check P2 eating
      const h2 = snake2Ref.current[0]
      if (h2) {
        foodRef.current.forEach((f, idx) => {
          if (Math.hypot(f.x - h2.x, f.y - h2.y) < 18) {
            try { sound.playClick() } catch {}
            snake2Ref.current.push({ ...snake2Ref.current[snake2Ref.current.length - 1] })
            setRivalScore(snake2Ref.current.length)

            for (let i = 0; i < 5; i++) {
              particlesRef.current.push({
                x: f.x,
                y: f.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: f.color,
                alpha: 1,
                size: Math.random() * 4 + 2
              })
            }

            foodRef.current[idx] = {
              id: f.id,
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              color: f.color,
              value: 1
            }
          }
        })
      }

      // Check AI eating
      aiSnakesRef.current.forEach((ai) => {
        const head = ai.segments[0]
        if (!head) return
        foodRef.current.forEach((f, idx) => {
          if (Math.hypot(f.x - head.x, f.y - head.y) < 18) {
            ai.segments.push({ ...ai.segments[ai.segments.length - 1] })
            foodRef.current[idx] = {
              id: f.id,
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              color: f.color,
              value: 1
            }
          }
        })
      })
    }

    // 7. Crash / Death Check (Head to body collisions)
    if (canManageFood) {
      const h1 = snake1Ref.current[0]
      const h2 = snake2Ref.current[0]

      // check if P1 crashes head-first into P2 body
      if (h1 && h2) {
        // Crash into P2
        snake2Ref.current.slice(1).forEach((seg) => {
          if (Math.hypot(seg.x - h1.x, seg.y - h1.y) < 12) {
            // P1 Dies!
            handleGameOver(connectionStatus === 'connected' ? 'Guest Player Wins!' : 'Player 2 Wins!')
          }
        })

        // check if P2 crashes head-first into P1 body
        snake1Ref.current.slice(1).forEach((seg) => {
          if (Math.hypot(seg.x - h2.x, seg.y - h2.y) < 12) {
            // P2 Dies!
            handleGameOver('Player 1 Wins!')
          }
        })
      }

      // AI Crashes
      if (h1 && aiSnakesRef.current.length > 0) {
        aiSnakesRef.current.forEach((ai) => {
          const aiHead = ai.segments[0]
          if (!aiHead) return

          // AI crashes into P1
          snake1Ref.current.forEach((seg) => {
            if (Math.hypot(seg.x - aiHead.x, seg.y - aiHead.y) < 12) {
              // AI dies, respawn
              respawnAI(ai)
            }
          })

          // P1 crashes into AI
          ai.segments.forEach((seg) => {
            if (Math.hypot(seg.x - h1.x, seg.y - h1.y) < 12) {
              handleGameOver('AI Wins!')
            }
          })
        })
      }
    }

    // 8. Draw Food pellets (neon glowing circles)
    foodRef.current.forEach((f) => {
      ctx.shadowBlur = 10
      ctx.shadowColor = f.color
      ctx.fillStyle = f.color
      ctx.beginPath()
      ctx.arc(f.x, f.y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    // 9. Draw particles
    particlesRef.current.forEach((p, idx) => {
      p.x += p.vx
      p.y += p.vy
      p.alpha -= 0.02
      if (p.alpha <= 0) {
        particlesRef.current.splice(idx, 1)
        return
      }
      ctx.shadowBlur = 5
      ctx.shadowColor = p.color
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1.0 // reset

    // 10. Draw Snake 1 (User / Host)
    ctx.shadowBlur = 15
    ctx.shadowColor = selectedSkin.color
    
    // Draw Body segments
    snake1Ref.current.forEach((seg, idx) => {
      const ratio = 1 - idx / snake1Ref.current.length
      ctx.fillStyle = selectedSkin.color
      ctx.beginPath()
      ctx.arc(seg.x, seg.y, 8 * ratio + 3, 0, Math.PI * 2)
      ctx.fill()
    })
    
    // Draw Head details (Eyes looking forward)
    const h1 = snake1Ref.current[0]
    if (h1) {
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      const eyeX1 = h1.x + Math.cos(angle1Ref.current + 0.5) * 6
      const eyeY1 = h1.y + Math.sin(angle1Ref.current + 0.5) * 6
      const eyeX2 = h1.x + Math.cos(angle1Ref.current - 0.5) * 6
      const eyeY2 = h1.y + Math.sin(angle1Ref.current - 0.5) * 6
      ctx.arc(eyeX1, eyeY1, 3.5, 0, Math.PI * 2)
      ctx.arc(eyeX2, eyeY2, 3.5, 0, Math.PI * 2)
      ctx.fill()

      // Pupils
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(eyeX1 + Math.cos(angle1Ref.current) * 1.5, eyeY1 + Math.sin(angle1Ref.current) * 1.5, 1.5, 0, Math.PI * 2)
      ctx.arc(eyeX2 + Math.cos(angle1Ref.current) * 1.5, eyeY2 + Math.sin(angle1Ref.current) * 1.5, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // 11. Draw Snake 2 (Guest / Rival)
    const color2 = '#ec4899'
    ctx.shadowColor = color2
    snake2Ref.current.forEach((seg, idx) => {
      const ratio = 1 - idx / snake2Ref.current.length
      ctx.fillStyle = color2
      ctx.beginPath()
      ctx.arc(seg.x, seg.y, 8 * ratio + 3, 0, Math.PI * 2)
      ctx.fill()
    })

    const h2 = snake2Ref.current[0]
    if (h2) {
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      const eyeX1 = h2.x + Math.cos(angle2Ref.current + 0.5) * 6
      const eyeY1 = h2.y + Math.sin(angle2Ref.current + 0.5) * 6
      const eyeX2 = h2.x + Math.cos(angle2Ref.current - 0.5) * 6
      const eyeY2 = h2.y + Math.sin(angle2Ref.current - 0.5) * 6
      ctx.arc(eyeX1, eyeY1, 3.5, 0, Math.PI * 2)
      ctx.arc(eyeX2, eyeY2, 3.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(eyeX1 + Math.cos(angle2Ref.current) * 1.5, eyeY1 + Math.sin(angle2Ref.current) * 1.5, 1.5, 0, Math.PI * 2)
      ctx.arc(eyeX2 + Math.cos(angle2Ref.current) * 1.5, eyeY2 + Math.sin(angle2Ref.current) * 1.5, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // 12. Draw AI Snakes
    aiSnakesRef.current.forEach((ai) => {
      ctx.shadowColor = ai.color
      ai.segments.forEach((seg, idx) => {
        const ratio = 1 - idx / ai.segments.length
        ctx.fillStyle = ai.color
        ctx.beginPath()
        ctx.arc(seg.x, seg.y, 8 * ratio + 3, 0, Math.PI * 2)
        ctx.fill()
      })
    })

    // Reset shadow blur
    ctx.shadowBlur = 0

    if (!gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
  }

  const respawnAI = (ai: any) => {
    const startX = 100 + Math.random() * 800
    const startY = 100 + Math.random() * 500
    ai.segments = []
    for (let i = 0; i < 12; i++) {
      ai.segments.push({ x: startX, y: startY })
    }
    ai.angle = Math.random() * Math.PI * 2
  }

  const handleGameOver = (winner: string) => {
    setGameOver(true)
    setWinnerMessage(winner)
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)

    // Trigger success confetti if user wins
    if (winner.includes('Player 1') || winner.includes('Host')) {
      try {
        sound.playWin()
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } })
      } catch {}
      
      // Award real XP / Coins in DB
      claimCoinReward()
    }

    // Broadcast state online
    if (connectionStatus === 'connected' && onlineRole === 'host') {
      if (dataChannelRef.current?.readyState === 'open') {
        dataChannelRef.current.send(JSON.stringify({ type: 'gameover', winner }))
      }
    }
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-muted/60 border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black font-display text-foreground uppercase tracking-wider flex items-center gap-2">
                <Gamepad2 className="h-6 w-6 text-primary animate-pulse" />
                <span>Spike Snake Arena</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Steer your neon snake, eat glowing energy dots, grow, and trap other players to claim rewards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-muted/20 border border-border/60 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
            <Trophy className="h-4 w-4 text-accent" />
            <span>Score: {score}</span>
            {activeMode === 'playing' && (
              <>
                <span className="text-muted-foreground">|</span>
                <span className="text-secondary">Rival: {rivalScore}</span>
              </>
            )}
          </div>
        </div>

        {/* LOBBY / SKIN SELECT PANEL */}
        {activeMode === 'lobby' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Skin Select Card */}
            <div className="p-6 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-4">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Configure Glow Skin</span>
              
              <div className="flex flex-col gap-3">
                {SKINS.map((skin) => (
                  <button
                    key={skin.id}
                    onClick={() => setSelectedSkin(skin)}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      selectedSkin.id === skin.id
                        ? 'border-primary bg-primary/5 shadow-lg'
                        : 'border-border/40 hover:bg-muted/60'
                    }`}
                  >
                    <span className="text-xs font-extrabold text-foreground">{skin.name}</span>
                    <div 
                      className="h-4.5 w-4.5 rounded-full border border-white/10" 
                      style={{ backgroundColor: skin.color, boxShadow: `0 0 10px ${skin.color}` }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* In-Game Game modes Selection */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-5 justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Match Mode</span>
                <h3 className="text-xl font-black font-display tracking-wide text-foreground uppercase mt-1">
                  Ingest into the Arena Grid
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  Battle against automated AI bots to hone your steering reflexes, or challenge friends to real-time split-screen keyboard matches, or establish low-latency peer-to-peer WebRTC connections.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => { setActiveMode('single'); startGame('single'); }}
                  className="p-5 rounded-2xl border border-border/40 hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col gap-3 items-center text-center cursor-pointer group"
                >
                  <Gamepad2 className="h-8 w-8 text-primary group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-bold text-foreground">Single Player vs AI</span>
                  <span className="text-[9px] text-muted-foreground">Compete against active AI bots on the board.</span>
                </button>

                <button
                  onClick={() => { setActiveMode('local'); startGame('local'); }}
                  className="p-5 rounded-2xl border border-border/40 hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col gap-3 items-center text-center cursor-pointer group"
                >
                  <Users className="h-8 w-8 text-secondary group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-bold text-foreground">Local PvP Split</span>
                  <span className="text-[9px] text-muted-foreground">Two players on one keyboard (WASD vs Arrows).</span>
                </button>

                <button
                  onClick={() => setActiveMode('online_lobby')}
                  className="p-5 rounded-2xl border border-border/40 hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col gap-3 items-center text-center cursor-pointer group"
                >
                  <Users className="h-8 w-8 text-accent group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-bold text-foreground">Online WebRTC Match</span>
                  <span className="text-[9px] text-muted-foreground">Create/Join peer lobbies with zero-latency links.</span>
                </button>
              </div>

              <div className="p-3 bg-muted/10 border border-border/30 rounded-xl flex items-center gap-2">
                <Trophy className="h-4.5 w-4.5 text-accent" />
                <span className="text-[10px] text-muted-foreground leading-relaxed">
                  Completing games and scoring high earns coins and XP rewards synced directly to your database profile wallet!
                </span>
              </div>
            </div>

          </div>
        )}

        {/* ONLINE WEBGL LOBBY PANEL */}
        {activeMode === 'online_lobby' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Create / Join Room Form */}
            <div className="p-6 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-5 justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  WebRTC Lobby Setup
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Set up a zero-latency match lobby. Copy the generated code to your friend, or paste their code to join their board.
                </p>
              </div>

              {connectionStatus === 'idle' && (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={createHostLobby}
                    className="w-full h-11 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider transition-all hover:bg-primary/95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
                  >
                    <span>Create Host Lobby</span>
                  </button>

                  <div className="flex items-center gap-2 text-muted-foreground/40 my-1">
                    <div className="h-px bg-border/40 flex-1" />
                    <span className="text-[9px] font-black uppercase">OR</span>
                    <div className="h-px bg-border/40 flex-1" />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Join Code..."
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      className="h-10 px-3.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary flex-1 uppercase font-mono text-center tracking-wider"
                    />
                    <button
                      onClick={joinGuestLobby}
                      className="h-10 px-6 rounded-xl bg-muted/60 border border-border/80 hover:bg-muted text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Join Match
                    </button>
                  </div>
                </div>
              )}

              {/* Waiting Room state */}
              {connectionStatus === 'creating' && (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-xs text-muted-foreground">Generating signaling link in database...</span>
                </div>
              )}

              {connectionStatus === 'waiting' && (
                <div className="flex flex-col p-4 rounded-xl border border-primary/20 bg-primary/5 text-center gap-3">
                  <span className="text-xs font-bold text-foreground">Waiting for peer connection...</span>
                  <div className="text-2xl font-mono font-black text-primary tracking-widest bg-background py-2.5 rounded-lg border border-border select-all">
                    {roomCode}
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-relaxed">
                    Share this code with your friend. Keep this window open. Connection starts automatically once they enter it.
                  </span>
                </div>
              )}

              {connectionStatus === 'connecting' && (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
                  <span className="text-xs text-secondary font-bold">Bridging WebRTC peer data channels...</span>
                </div>
              )}

              {connectionStatus === 'connected' && (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                  <Check className="h-8 w-8 text-emerald-400 animate-bounce" />
                  <span className="text-xs text-emerald-400 font-bold">Successfully Connected! Starting Board...</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                onClick={() => { cleanupWebRTC(); setActiveMode('lobby'); }}
                className="text-xs text-muted-foreground hover:underline text-center mt-2"
              >
                Cancel and return to mode selection
              </button>
            </div>

            {/* Chat Box Widget */}
            <div className="p-6 rounded-2xl bg-card border border-border/40 shadow flex flex-col gap-4 justify-between h-[360px]">
              <div className="flex items-center justify-between border-b border-border/20 pb-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Lobby Chat</span>
                <span className={`h-2.5 w-2.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
              </div>

              {/* Chat entries */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-2 rounded-xl bg-muted/20 border border-border/40 font-mono text-xs pr-2">
                {chatLog.length === 0 ? (
                  <span className="text-muted-foreground/40 italic text-center my-auto">Lobby chat inactive. Establish peer connection to chat.</span>
                ) : (
                  chatLog.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log}
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendLobbyChat()}
                  disabled={connectionStatus !== 'connected'}
                  className="h-10 px-3.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary flex-1 disabled:opacity-50"
                />
                <button
                  onClick={sendLobbyChat}
                  disabled={connectionStatus !== 'connected'}
                  className="h-10 px-4 rounded-xl bg-primary text-white hover:bg-primary/90 flex items-center justify-center disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ACTIVE CANVAS VIEWPORT SCREEN */}
        {activeMode === 'playing' && (
          <div className="relative rounded-3xl border border-border/60 overflow-hidden shadow-2xl bg-black flex items-center justify-center">
            
            <canvas
              ref={canvasRef}
              width={1120}
              height={560}
              className="w-full max-w-full aspect-[2/1] block bg-black"
            />

            {/* Game Over modal overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 gap-6 z-30 animate-in fade-in duration-300">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-lg flex items-center justify-center">
                  <div className="h-full w-full bg-black rounded-[12px] flex items-center justify-center text-primary">
                    <Trophy className="h-6 w-6" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-black font-display text-foreground uppercase tracking-widest">
                    MATCH CONCLUDED
                  </h2>
                  <p className="text-lg font-bold text-primary tracking-wide">
                    {winnerMessage}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Final Snake Length: <strong className="text-white">{score} segments</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startGame(connectionStatus === 'connected' ? 'online' : 'single')}
                    className="h-11 px-6 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    <span>Rematch</span>
                  </button>

                  <button
                    onClick={() => { cleanupWebRTC(); setActiveMode('lobby'); }}
                    className="h-11 px-6 rounded-xl border border-border/80 hover:bg-muted text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    Return to Lobby
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </AppShell>
  )
}
