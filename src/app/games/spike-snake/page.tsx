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
  size: number
}

interface Skin {
  id: string
  name: string
  color: string
  glowColor: string
  darkColor: string
}

const SKINS: Skin[] = [
  { id: 'classic-green', name: 'Classic Green', color: '#22c55e', glowColor: 'rgba(34,197,94,0.6)', darkColor: '#14532d' },
  { id: 'retro-pink', name: 'Neon Retro Pink', color: '#ec4899', glowColor: 'rgba(236,72,153,0.6)', darkColor: '#500724' },
  { id: 'cyan-hacker', name: 'Cyan Hacker', color: '#06b6d4', glowColor: 'rgba(6,182,212,0.6)', darkColor: '#164e63' },
  { id: 'gold-champion', name: 'Cosmic Gold', color: '#eab308', glowColor: 'rgba(234,179,8,0.6)', darkColor: '#451a03' }
]

// Arena Map Constants
const MAP_WIDTH = 2400
const MAP_HEIGHT = 1600
const SEGMENT_SPACING = 7.2 // Distance between follow segments

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

  // Mouse steer reference
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Game Entities (ref-based for instant access in canvas loop)
  const snake1Ref = useRef<SnakeSegment[]>([])
  const angle1Ref = useRef<number>(0)
  const targetAngle1Ref = useRef<number>(0)
  const speed1Ref = useRef<number>(3)

  const snake2Ref = useRef<SnakeSegment[]>([])
  const angle2Ref = useRef<number>(0)
  const targetAngle2Ref = useRef<number>(0)
  const speed2Ref = useRef<number>(3)

  const aiSnakesRef = useRef<{ id: string; name: string; color: string; darkColor: string; segments: SnakeSegment[]; angle: number; speed: number }[]>([])
  const foodRef = useRef<FoodPellet[]>([])
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; alpha: number; size: number }[]>([])

  // Setup inputs and mouse trackers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = false
    }

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      // Mouse coordinate relative to canvas center (since camera follows snake 1)
      mousePosRef.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      cleanupWebRTC()
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [])

  // WebRTC signaling and messaging
  const setupDataChannel = (channel: RTCDataChannel) => {
    dataChannelRef.current = channel
    channel.onopen = () => {
      setConnectionStatus('connected')
      setChatLog((prev) => [...prev, 'System: WebRTC Peer Connection Established!'])
      try { sound.playTick() } catch {}
      
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
          snake2Ref.current = msg.segments
          angle2Ref.current = msg.angle
        } else if (msg.type === 'sync') {
          snake1Ref.current = msg.hostSnake
          angle1Ref.current = msg.hostAngle
          foodRef.current = msg.food
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

  const sendLobbyChat = () => {
    if (!chatInput.trim()) return
    const msg = `${user?.username || 'Player'}: ${chatInput}`
    
    setChatLog((prev) => [...prev, msg])
    if (dataChannelRef.current?.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify({ type: 'chat', text: msg }))
    }
    setChatInput('')
  }

  // Generate starting entities with realistic physics positioning
  const generateStartingSnakes = () => {
    // Player 1 (Starts Left-Center)
    snake1Ref.current = []
    const startX1 = MAP_WIDTH * 0.25
    const startY1 = MAP_HEIGHT * 0.5
    for (let i = 0; i < 20; i++) {
      snake1Ref.current.push({ x: startX1 - i * SEGMENT_SPACING, y: startY1 })
    }
    angle1Ref.current = 0
    targetAngle1Ref.current = 0
    speed1Ref.current = 3.2

    // Player 2 / Online Guest (Starts Right-Center)
    snake2Ref.current = []
    const startX2 = MAP_WIDTH * 0.75
    const startY2 = MAP_HEIGHT * 0.5
    for (let i = 0; i < 20; i++) {
      snake2Ref.current.push({ x: startX2 + i * SEGMENT_SPACING, y: startY2 })
    }
    angle2Ref.current = Math.PI
    targetAngle2Ref.current = Math.PI
    speed2Ref.current = 3.2

    // AI snakes
    aiSnakesRef.current = []
    if (gameSubModeRef.current === 'single') {
      const colors = [
        { main: '#a855f7', dark: '#3b0764' },
        { main: '#f43f5e', dark: '#4c0519' },
        { main: '#3b82f6', dark: '#172554' },
        { main: '#10b981', dark: '#022c22' }
      ]
      for (let k = 0; k < 6; k++) {
        const startX = 200 + Math.random() * (MAP_WIDTH - 400)
        const startY = 200 + Math.random() * (MAP_HEIGHT - 400)
        const segments: SnakeSegment[] = []
        for (let i = 0; i < 15; i++) {
          segments.push({ x: startX, y: startY })
        }
        const col = colors[k % colors.length]
        aiSnakesRef.current.push({
          id: `ai-${k}`,
          name: `Cyber Predator ${k + 1}`,
          color: col.main,
          darkColor: col.dark,
          segments,
          angle: Math.random() * Math.PI * 2,
          speed: 2.5
        })
      }
    }

    // Glowing Neon Food pellets
    foodRef.current = []
    const colors = ['#22c55e', '#ec4899', '#06b6d4', '#eab308', '#a855f7']
    for (let i = 0; i < 120; i++) {
      foodRef.current.push({
        id: `food-${i}`,
        x: 50 + Math.random() * (MAP_WIDTH - 100),
        y: 50 + Math.random() * (MAP_HEIGHT - 100),
        color: colors[Math.floor(Math.random() * colors.length)],
        value: 1,
        size: Math.random() * 3 + 2.5
      })
    }

    particlesRef.current = []
  }

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

  const startGame = (mode: 'single' | 'local' | 'online') => {
    gameSubModeRef.current = mode
    generateStartingSnakes()
    setGameOver(false)
    setWinnerMessage('')
    setScore(20)
    setRivalScore(20)

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

  // Realistic physics follow loop calculation
  const updateSnakePhysics = (segments: SnakeSegment[], angle: number, speed: number) => {
    if (segments.length === 0) return

    // 1. Move the head segment
    const head = segments[0]
    head.x += Math.cos(angle) * speed
    head.y += Math.sin(angle) * speed

    // Clamp head inside arena bounds
    head.x = Math.max(12, Math.min(MAP_WIDTH - 12, head.x))
    head.y = Math.max(12, Math.min(MAP_HEIGHT - 12, head.y))

    // 2. Drag segments sequentially using standard Slither.io string distance constraints
    for (let i = 1; i < segments.length; i++) {
      const prev = segments[i - 1]
      const curr = segments[i]
      const dx = prev.x - curr.x
      const dy = prev.y - curr.y
      const dist = Math.hypot(dx, dy)
      
      if (dist > SEGMENT_SPACING) {
        const followAngle = Math.atan2(dy, dx)
        curr.x = prev.x - Math.cos(followAngle) * SEGMENT_SPACING
        curr.y = prev.y - Math.sin(followAngle) * SEGMENT_SPACING
      }
    }
  }

  // Game Loop logic
  const gameLoop = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 1. Setup Camera system centering on Player 1
    const p1Head = snake1Ref.current[0]
    const p2Head = snake2Ref.current[0]

    // Default target for camera coordinates
    let targetCamX = 0
    let targetCamY = 0

    if (p1Head) {
      targetCamX = p1Head.x - canvas.width / 2
      targetCamY = p1Head.y - canvas.height / 2
    } else if (p2Head) {
      targetCamX = p2Head.x - canvas.width / 2
      targetCamY = p2Head.y - canvas.height / 2
    }

    // Clamp camera within map coordinates
    const camX = Math.max(0, Math.min(MAP_WIDTH - canvas.width, targetCamX))
    const camY = Math.max(0, Math.min(MAP_HEIGHT - canvas.height, targetCamY))

    // Clean canvas viewport
    ctx.fillStyle = '#07070a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 2. Draw arena grid system relative to camera
    ctx.strokeStyle = '#12121e'
    ctx.lineWidth = 1
    const size = 38
    
    // Draw hex pattern background offset by camera
    const startGridX = Math.floor(camX / (size * Math.sqrt(3))) * (size * Math.sqrt(3))
    const startGridY = Math.floor(camY / (size * 1.5)) * (size * 1.5)

    for (let y = startGridY - size * 3; y < startGridY + canvas.height + size * 3; y += size * 1.5) {
      for (let x = startGridX - size * 3; x < startGridX + canvas.width + size * 3; x += size * Math.sqrt(3)) {
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3
          const worldHexX = x + (y % (size * 3) === 0 ? 0 : (size * Math.sqrt(3)) / 2) + size * Math.cos(angle)
          const worldHexY = y + size * Math.sin(angle)
          
          ctx.lineTo(worldHexX - camX, worldHexY - camY)
        }
        ctx.closePath()
        ctx.stroke()
      }
    }

    // Draw Map Boundaries
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'
    ctx.lineWidth = 4
    ctx.strokeRect(-camX, -camY, MAP_WIDTH, MAP_HEIGHT)

    // 3. User Input & Heading steering (Mouse navigation has priority)
    if (activeMode === 'playing') {
      if (p1Head) {
        // Calculate steer heading based on mouse offset relative to screen center
        const mouseAngle = Math.atan2(mousePosRef.current.y, mousePosRef.current.x)
        targetAngle1Ref.current = mouseAngle

        // WASD overrides
        if (keysPressedRef.current['a'] || keysPressedRef.current['A']) targetAngle1Ref.current -= 0.08
        if (keysPressedRef.current['d'] || keysPressedRef.current['D']) targetAngle1Ref.current += 0.08

        // Boost acceleration handler
        if (keysPressedRef.current[' ']) {
          speed1Ref.current = 5.2
          // spawn trail particles from tail segment
          const tail = snake1Ref.current[snake1Ref.current.length - 1]
          if (tail && Math.random() < 0.25) {
            particlesRef.current.push({
              x: tail.x,
              y: tail.y,
              vx: -Math.cos(angle1Ref.current) * 1.5 + (Math.random() - 0.5),
              vy: -Math.sin(angle1Ref.current) * 1.5 + (Math.random() - 0.5),
              color: selectedSkin.color,
              alpha: 0.8,
              size: Math.random() * 2.5 + 1.2
            })
          }
        } else {
          speed1Ref.current = 3.2
        }

        // Interpolate angle smoothly
        let diff = targetAngle1Ref.current - angle1Ref.current
        while (diff < -Math.PI) diff += Math.PI * 2
        while (diff > Math.PI) diff -= Math.PI * 2
        angle1Ref.current += diff * 0.15

        updateSnakePhysics(snake1Ref.current, angle1Ref.current, speed1Ref.current)
      }
    }

    // 4. Steer Player 2 (Local PvP)
    if (activeMode === 'playing' && gameSubModeRef.current === 'local') {
      const h2 = snake2Ref.current[0]
      if (h2) {
        if (keysPressedRef.current['ArrowLeft']) targetAngle2Ref.current -= 0.08
        if (keysPressedRef.current['ArrowRight']) targetAngle2Ref.current += 0.08
        
        if (keysPressedRef.current['Enter']) {
          speed2Ref.current = 5.2
          const tail = snake2Ref.current[snake2Ref.current.length - 1]
          if (tail && Math.random() < 0.25) {
            particlesRef.current.push({
              x: tail.x,
              y: tail.y,
              vx: -Math.cos(angle2Ref.current) * 1.5 + (Math.random() - 0.5),
              vy: -Math.sin(angle2Ref.current) * 1.5 + (Math.random() - 0.5),
              color: '#ec4899',
              alpha: 0.8,
              size: Math.random() * 2.5 + 1.2
            })
          }
        } else {
          speed2Ref.current = 3.2
        }

        let diff = targetAngle2Ref.current - angle2Ref.current
        while (diff < -Math.PI) diff += Math.PI * 2
        while (diff > Math.PI) diff -= Math.PI * 2
        angle2Ref.current += diff * 0.15

        updateSnakePhysics(snake2Ref.current, angle2Ref.current, speed2Ref.current)
      }
    }

    // 5. Update WebRTC online guest state
    if (connectionStatus === 'connected') {
      if (onlineRole === 'host') {
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
        if (dataChannelRef.current?.readyState === 'open') {
          dataChannelRef.current.send(JSON.stringify({
            type: 'snake',
            segments: snake2Ref.current,
            angle: angle2Ref.current
          }))
        }
        
        // Guest steers its snake2 locally
        const h2 = snake2Ref.current[0]
        if (h2) {
          // keyboard overrides
          if (keysPressedRef.current['a'] || keysPressedRef.current['A']) targetAngle2Ref.current -= 0.08
          if (keysPressedRef.current['d'] || keysPressedRef.current['D']) targetAngle2Ref.current += 0.08
          
          let diff = targetAngle2Ref.current - angle2Ref.current
          while (diff < -Math.PI) diff += Math.PI * 2
          while (diff > Math.PI) diff -= Math.PI * 2
          angle2Ref.current += diff * 0.15

          updateSnakePhysics(snake2Ref.current, angle2Ref.current, speed2Ref.current)
        }
      }
    }

    // 6. Update AI Snakes (Single Player Mode)
    if (activeMode === 'playing' && aiSnakesRef.current.length > 0) {
      aiSnakesRef.current.forEach((ai) => {
        const head = ai.segments[0]
        if (!head) return

        // Target closest food
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
          ai.angle += (targetAngle - ai.angle) * 0.08
        }

        updateSnakePhysics(ai.segments, ai.angle, ai.speed)
      })
    }

    // 7. Food collision checks (host or local client computes)
    const canManageFood = connectionStatus !== 'connected' || onlineRole === 'host'
    if (canManageFood) {
      const h1 = snake1Ref.current[0]
      const h2 = snake2Ref.current[0]

      // P1 eat check
      if (h1) {
        foodRef.current.forEach((f, idx) => {
          if (Math.hypot(f.x - h1.x, f.y - h1.y) < 18) {
            try { sound.playClick() } catch {}
            snake1Ref.current.push({ ...snake1Ref.current[snake1Ref.current.length - 1] })
            setScore(snake1Ref.current.length)

            // Spark particles on consume
            for (let i = 0; i < 4; i++) {
              particlesRef.current.push({
                x: f.x,
                y: f.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: f.color,
                alpha: 1,
                size: Math.random() * 3 + 1.5
              })
            }

            // Respawn
            foodRef.current[idx] = {
              id: f.id,
              x: 50 + Math.random() * (MAP_WIDTH - 100),
              y: 50 + Math.random() * (MAP_HEIGHT - 100),
              color: f.color,
              value: 1,
              size: Math.random() * 3 + 2.5
            }
          }
        })
      }

      // P2 eat check
      if (h2) {
        foodRef.current.forEach((f, idx) => {
          if (Math.hypot(f.x - h2.x, f.y - h2.y) < 18) {
            try { sound.playClick() } catch {}
            snake2Ref.current.push({ ...snake2Ref.current[snake2Ref.current.length - 1] })
            setRivalScore(snake2Ref.current.length)

            for (let i = 0; i < 4; i++) {
              particlesRef.current.push({
                x: f.x,
                y: f.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: f.color,
                alpha: 1,
                size: Math.random() * 3 + 1.5
              })
            }

            foodRef.current[idx] = {
              id: f.id,
              x: 50 + Math.random() * (MAP_WIDTH - 100),
              y: 50 + Math.random() * (MAP_HEIGHT - 100),
              color: f.color,
              value: 1,
              size: Math.random() * 3 + 2.5
            }
          }
        })
      }

      // AI eat check
      aiSnakesRef.current.forEach((ai) => {
        const head = ai.segments[0]
        if (!head) return
        foodRef.current.forEach((f, idx) => {
          if (Math.hypot(f.x - head.x, f.y - head.y) < 18) {
            ai.segments.push({ ...ai.segments[ai.segments.length - 1] })
            foodRef.current[idx] = {
              id: f.id,
              x: 50 + Math.random() * (MAP_WIDTH - 100),
              y: 50 + Math.random() * (MAP_HEIGHT - 100),
              color: f.color,
              value: 1,
              size: Math.random() * 3 + 2.5
            }
          }
        })
      })
    }

    // 8. Head-to-body crash detections (Standard Slither Rules)
    if (canManageFood) {
      const h1 = snake1Ref.current[0]
      const h2 = snake2Ref.current[0]

      if (h1 && h2) {
        // Player 1 crashes into Player 2 body
        snake2Ref.current.slice(1).forEach((seg) => {
          if (Math.hypot(seg.x - h1.x, seg.y - h1.y) < 13) {
            handleGameOver(connectionStatus === 'connected' ? 'Guest Player Wins!' : 'Player 2 Wins!')
          }
        })

        // Player 2 crashes into Player 1 body
        snake1Ref.current.slice(1).forEach((seg) => {
          if (Math.hypot(seg.x - h2.x, seg.y - h2.y) < 13) {
            handleGameOver('Player 1 Wins!')
          }
        })
      }

      // AI crash evaluations
      if (h1 && aiSnakesRef.current.length > 0) {
        aiSnakesRef.current.forEach((ai) => {
          const aiHead = ai.segments[0]
          if (!aiHead) return

          // AI crashes into P1 body -> AI dies & drops food
          snake1Ref.current.forEach((seg) => {
            if (Math.hypot(seg.x - aiHead.x, seg.y - aiHead.y) < 12) {
              spawnSheddedFood(ai.segments)
              respawnAI(ai)
            }
          })

          // P1 crashes into AI body -> P1 dies
          ai.segments.slice(1).forEach((seg) => {
            if (Math.hypot(seg.x - h1.x, seg.y - h1.y) < 13) {
              handleGameOver('AI Wins!')
            }
          })
        })
      }
    }

    // Helper to spawn shedded food from dead snake segments
    const spawnSheddedFood = (deadSegments: SnakeSegment[]) => {
      deadSegments.forEach((seg, idx) => {
        if (idx % 2 === 0) {
          foodRef.current.push({
            id: `food-shed-${Date.now()}-${idx}-${Math.random()}`,
            x: seg.x + (Math.random() - 0.5) * 20,
            y: seg.y + (Math.random() - 0.5) * 20,
            color: '#ef4444',
            value: 2,
            size: 5
          })
        }
      })
    }

    // 9. Draw Food pellets (offset by camera)
    foodRef.current.forEach((f) => {
      const screenX = f.x - camX
      const screenY = f.y - camY
      
      ctx.shadowBlur = 10
      ctx.shadowColor = f.color
      ctx.fillStyle = f.color
      ctx.beginPath()
      ctx.arc(screenX, screenY, f.size, 0, Math.PI * 2)
      ctx.fill()
    })

    // 10. Draw particles
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
      ctx.arc(p.x - camX, p.y - camY, p.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1.0 // reset shadow/alpha

    // Helper to render a 3D Shaded sphere segment
    const draw3DSphereSegment = (x: number, y: number, r: number, color: string, darkColor: string) => {
      const screenX = x - camX
      const screenY = y - camY

      const grad = ctx.createRadialGradient(
        screenX - r * 0.3, screenY - r * 0.3, r * 0.1,
        screenX, screenY, r
      )
      // Highlight coordinates simulation
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(0.2, color)
      grad.addColorStop(0.8, darkColor)
      grad.addColorStop(1, '#000000')

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(screenX, screenY, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // Helper to draw head armor spiky thorns (Advanced Spikes feature)
    const drawSpikesOnHead = (x: number, y: number, angle: number, r: number) => {
      const screenX = x - camX
      const screenY = y - camY
      ctx.fillStyle = '#94a3b8' // steel chrome color
      ctx.strokeStyle = '#475569'
      ctx.lineWidth = 1

      const drawSpikeTriangle = (spikeAngle: number) => {
        const baseWidth = 5
        const spikeLength = 10

        const tipX = screenX + Math.cos(spikeAngle) * (r + spikeLength)
        const tipY = screenY + Math.sin(spikeAngle) * (r + spikeLength)

        const leftBaseX = screenX + Math.cos(spikeAngle + 0.3) * r
        const leftBaseY = screenY + Math.sin(spikeAngle + 0.3) * r

        const rightBaseX = screenX + Math.cos(spikeAngle - 0.3) * r
        const rightBaseY = screenY + Math.sin(spikeAngle - 0.3) * r

        ctx.beginPath()
        ctx.moveTo(leftBaseX, leftBaseY)
        ctx.lineTo(tipX, tipY)
        ctx.lineTo(rightBaseX, rightBaseY)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      // Draw lateral spikes (Left / Right perpendicular angles)
      drawSpikeTriangle(angle + Math.PI / 2)
      drawSpikeTriangle(angle - Math.PI / 2)
    }

    // 11. Render Snake 1 (Host client)
    ctx.shadowBlur = 18
    ctx.shadowColor = selectedSkin.color
    
    // Draw body segments (backwards to draw head overlay correctly)
    for (let i = snake1Ref.current.length - 1; i >= 0; i--) {
      const seg = snake1Ref.current[i]
      const ratio = 1 - i / snake1Ref.current.length
      const radius = 9 * ratio + 3.5
      draw3DSphereSegment(seg.x, seg.y, radius, selectedSkin.color, selectedSkin.darkColor)
      
      // armored spiky details every 4th segment
      if (i > 0 && i % 4 === 0) {
        drawSpikesOnHead(seg.x, seg.y, angle1Ref.current, radius)
      }
    }
    
    // Render head and eyes
    const h1 = snake1Ref.current[0]
    if (h1) {
      drawSpikesOnHead(h1.x, h1.y, angle1Ref.current, 12.5)

      // Eyes
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      const eyeX1 = h1.x - camX + Math.cos(angle1Ref.current + 0.45) * 7.5
      const eyeY1 = h1.y - camY + Math.sin(angle1Ref.current + 0.45) * 7.5
      const eyeX2 = h1.x - camX + Math.cos(angle1Ref.current - 0.45) * 7.5
      const eyeY2 = h1.y - camY + Math.sin(angle1Ref.current - 0.45) * 7.5
      ctx.arc(eyeX1, eyeY1, 3.8, 0, Math.PI * 2)
      ctx.arc(eyeX2, eyeY2, 3.8, 0, Math.PI * 2)
      ctx.fill()

      // Pupils looking ahead
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(eyeX1 + Math.cos(angle1Ref.current) * 1.5, eyeY1 + Math.sin(angle1Ref.current) * 1.5, 1.5, 0, Math.PI * 2)
      ctx.arc(eyeX2 + Math.cos(angle1Ref.current) * 1.5, eyeY2 + Math.sin(angle1Ref.current) * 1.5, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // 12. Render Snake 2 (Guest client / Local Player 2)
    const color2 = '#ec4899'
    const color2Dark = '#500724'
    ctx.shadowColor = color2
    for (let i = snake2Ref.current.length - 1; i >= 0; i--) {
      const seg = snake2Ref.current[i]
      const ratio = 1 - i / snake2Ref.current.length
      const radius = 9 * ratio + 3.5
      draw3DSphereSegment(seg.x, seg.y, radius, color2, color2Dark)
      
      if (i > 0 && i % 4 === 0) {
        drawSpikesOnHead(seg.x, seg.y, angle2Ref.current, radius)
      }
    }

    const h2 = snake2Ref.current[0]
    if (h2) {
      drawSpikesOnHead(h2.x, h2.y, angle2Ref.current, 12.5)

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      const eyeX1 = h2.x - camX + Math.cos(angle2Ref.current + 0.45) * 7.5
      const eyeY1 = h2.y - camY + Math.sin(angle2Ref.current + 0.45) * 7.5
      const eyeX2 = h2.x - camX + Math.cos(angle2Ref.current - 0.45) * 7.5
      const eyeY2 = h2.y - camY + Math.sin(angle2Ref.current - 0.45) * 7.5
      ctx.arc(eyeX1, eyeY1, 3.8, 0, Math.PI * 2)
      ctx.arc(eyeX2, eyeY2, 3.8, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(eyeX1 + Math.cos(angle2Ref.current) * 1.5, eyeY1 + Math.sin(angle2Ref.current) * 1.5, 1.5, 0, Math.PI * 2)
      ctx.arc(eyeX2 + Math.cos(angle2Ref.current) * 1.5, eyeY2 + Math.sin(angle2Ref.current) * 1.5, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // 13. Render AI Snakes
    aiSnakesRef.current.forEach((ai) => {
      ctx.shadowColor = ai.color
      for (let i = ai.segments.length - 1; i >= 0; i--) {
        const seg = ai.segments[i]
        const ratio = 1 - i / ai.segments.length
        const radius = 9 * ratio + 3.5
        draw3DSphereSegment(seg.x, seg.y, radius, ai.color, ai.darkColor)

        if (i > 0 && i % 4 === 0) {
          drawSpikesOnHead(seg.x, seg.y, ai.angle, radius)
        }
      }
    })

    // Reset shadow blur
    ctx.shadowBlur = 0

    if (!gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
  }

  const respawnAI = (ai: any) => {
    const startX = 200 + Math.random() * (MAP_WIDTH - 400)
    const startY = 200 + Math.random() * (MAP_HEIGHT - 400)
    ai.segments = []
    for (let i = 0; i < 15; i++) {
      ai.segments.push({ x: startX, y: startY })
    }
    ai.angle = Math.random() * Math.PI * 2
  }

  const handleGameOver = (winner: string) => {
    setGameOver(true)
    setWinnerMessage(winner)
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)

    if (winner.includes('Player 1') || winner.includes('Host')) {
      try {
        sound.playWin()
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } })
      } catch {}
      claimCoinReward()
    }

    if (connectionStatus === 'connected' && onlineRole === 'host') {
      if (dataChannelRef.current?.readyState === 'open') {
        dataChannelRef.current.send(JSON.stringify({ type: 'gameover', winner }))
      }
    }
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-muted/60 border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black font-display text-foreground uppercase tracking-wider flex items-center gap-2">
                <Gamepad2 className="h-6 w-6 text-primary animate-pulse" />
                <span>Spike Snake Arena (3D Sphere Physics)</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Steer your neon 3D spike-armored snake in a scrollable virtual grid. Trap rivals and absorb shedded cells.
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

            {/* Game mode select panel */}
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
                  onClick={() => { startGame('single'); }}
                  className="p-5 rounded-2xl border border-border/40 hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col gap-3 items-center text-center cursor-pointer group"
                >
                  <Gamepad2 className="h-8 w-8 text-primary group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-bold text-foreground">Single Player vs AI</span>
                  <span className="text-[9px] text-muted-foreground">Scroll map, eat energy dots, hunt AI bots.</span>
                </button>

                <button
                  onClick={() => { startGame('local'); }}
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
              className="w-full max-w-full aspect-[2/1] block bg-black cursor-crosshair"
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
                    ARENA DESTROYED
                  </h2>
                  <p className="text-lg font-bold text-primary tracking-wide">
                    {winnerMessage}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Final Score (Snake Length): <strong className="text-white">{score} cells</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startGame(gameSubModeRef.current)}
                    className="h-11 px-6 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    <span>Play Again</span>
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
