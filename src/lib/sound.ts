'use client'

class SoundManager {
  private ctx: AudioContext | null = null

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    // resume if suspended due to browser policy
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  playClick() {
    try {
      this.init()
      if (!this.ctx) return
      
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1)
      
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1)
      
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.1)
    } catch {}
  }

  playTick() {
    try {
      this.init()
      if (!this.ctx) return
      
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime)
      
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05)
      
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.05)
    } catch {}
  }

  playWin() {
    try {
      this.init()
      if (!this.ctx) return
      
      const now = this.ctx.currentTime
      const playTone = (freq: number, start: number, duration: number) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, start)
        gain.gain.setValueAtTime(0.05, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(start)
        osc.stop(start + duration)
      }

      // Arpeggio: C4, E4, G4, C5
      playTone(261.63, now, 0.12)
      playTone(329.63, now + 0.1, 0.12)
      playTone(392.00, now + 0.2, 0.12)
      playTone(523.25, now + 0.3, 0.25)
    } catch {}
  }

  playLevelUp() {
    try {
      this.init()
      if (!this.ctx) return
      
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(200, now)
      osc.frequency.linearRampToValueAtTime(1000, now + 0.5)
      
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.5)
      
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(now + 0.5)
    } catch {}
  }

  private musicPlaylist = [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  ]
  private currentTrackIndex = 0
  private audioNode: HTMLAudioElement | null = null

  playBackgroundMusic() {
    try {
      if (typeof window === 'undefined') return
      
      if (this.audioNode) {
        this.audioNode.play().catch((e) => console.log('Resume blocked:', e))
        return
      }

      this.audioNode = new Audio(this.musicPlaylist[this.currentTrackIndex])
      this.audioNode.volume = 0.22 // Comfortable background volume
      
      // Advance to next song when current track ends
      this.audioNode.addEventListener('ended', () => {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicPlaylist.length
        if (this.audioNode) {
          this.audioNode.src = this.musicPlaylist[this.currentTrackIndex]
          this.audioNode.play().catch(() => {})
        }
      })

      this.audioNode.play().catch((err) => {
        console.warn('Playback blocked by browser autoplay rules:', err)
      })
    } catch {}
  }

  stopBackgroundMusic() {
    if (this.audioNode) {
      this.audioNode.pause()
    }
  }
}

export const sound = new SoundManager()
export default sound
