'use client'

import React, { useState, useEffect } from 'react'
import AppShell from '@/components/layout/app-shell'
import { Coins, ShieldCheck, ShoppingBag, Palette, AlertCircle, Sparkles, Check } from 'lucide-react'
import { sound } from '@/lib/sound'
import { useUser } from '@clerk/nextjs'
import confetti from 'canvas-confetti'

interface BorderCosmetic {
  id: string
  name: string
  cost: number
  glowClass: string
  description: string
  borderStyle: string
}

const COSMETICS_LIST: BorderCosmetic[] = [
  {
    id: 'cyber-green',
    name: 'Cyber Matrix Green',
    cost: 250,
    glowClass: 'shadow-[0_0_15px_rgba(34,197,94,0.6)] border-green-500',
    description: 'Neon hacker aesthetics with high contrast green glow.',
    borderStyle: 'border-2 border-green-500'
  },
  {
    id: 'outrun-pink',
    name: 'Neon Retro Pink',
    cost: 500,
    glowClass: 'shadow-[0_0_15px_rgba(236,72,153,0.6)] border-pink-500',
    description: 'Vaporwave theme pink frame. Matches outrun arcade speeds.',
    borderStyle: 'border-2 border-pink-500 animate-pulse'
  },
  {
    id: 'gold-crown',
    name: 'Gold Championship',
    cost: 1000,
    glowClass: 'shadow-[0_0_20px_rgba(234,179,8,0.8)] border-yellow-500',
    description: 'Gold crown animations for legendary leaderboard players.',
    borderStyle: 'border-3 border-yellow-500 animate-bounce'
  },
  {
    id: 'rainbow-shift',
    name: 'Rainbow Sparkle Shift',
    cost: 2000,
    glowClass: 'shadow-[0_0_25px_rgba(168,85,247,0.8)] border-purple-500',
    description: 'Legendary dynamic shifting RGB spectrum border.',
    borderStyle: 'border-3 border-transparent bg-clip-border bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-yellow-500'
  }
]

export default function ShopPage() {
  const { isSignedIn, user } = useUser()
  const [coins, setCoins] = useState(100)
  const [unlockedBorders, setUnlockedBorders] = useState<string[]>(['none'])
  const [equippedBorder, setEquippedBorder] = useState('none')
  
  // Stripe modal state
  const [isProcessingStripe, setIsProcessingStripe] = useState(false)
  const [stripeSuccessMessage, setStripeSuccessMessage] = useState<string | null>(null)

  // Sync state with storage
  useEffect(() => {
    try {
      const val = localStorage.getItem('arcadecore_coins')
      if (val) setCoins(parseInt(val, 10))
      
      const unlocked = localStorage.getItem('arcadecore_unlocked_borders')
      if (unlocked) {
        setUnlockedBorders(JSON.parse(unlocked))
      } else {
        localStorage.setItem('arcadecore_unlocked_borders', JSON.stringify(['none']))
      }

      const equipped = localStorage.getItem('arcadecore_equipped_border')
      if (equipped) setEquippedBorder(equipped)
    } catch {}
  }, [])

  const triggerCoinsUpdate = (newCoins: number) => {
    localStorage.setItem('arcadecore_coins', newCoins.toString())
    setCoins(newCoins)
    // Dispatch local custom storage event so the Header updates immediately
    window.dispatchEvent(new Event('arcadecore_coins_updated'))
  }

  // Load Razorpay dynamic script helper
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  // Razorpay Checkout Integration
  const handleBuyCoins = async (amount: number, price: number) => {
    if (!isSignedIn) {
      alert('Please log in with Clerk to make purchases!')
      return
    }
    
    sound.playClick()
    setIsProcessingStripe(true) // Reuse loader state spinner

    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        setIsProcessingStripe(false)
        alert('Failed to load Razorpay payment SDK. Check your internet connection.')
        return
      }

      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins: amount, price: price })
      })

      const data = await res.json()
      if (!res.ok || !data.id) {
        setIsProcessingStripe(false)
        alert(data.error || 'Failed to initialize payment order.')
        return
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'ArcadeCore Coin Shop',
        description: `Purchase ${amount.toLocaleString()} Arcade Coins`,
        image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=200',
        order_id: data.id,
        handler: async function (response: any) {
          setIsProcessingStripe(true)
          try {
            const verifyRes = await fetch('/api/shop/verify-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                coins: amount,
                price: price
              })
            })
            const verifyData = await verifyRes.json()
            setIsProcessingStripe(false)
            
            if (verifyData.success) {
              triggerCoinsUpdate(verifyData.coins)
              setStripeSuccessMessage(`Successfully purchased ${amount} Coins!`)
              sound.playWin()
              confetti({
                particleCount: 100,
                spread: 75,
                origin: { y: 0.6 }
              })
              setTimeout(() => {
                setStripeSuccessMessage(null)
              }, 4000)
            } else {
              alert(verifyData.error || 'Payment signature verification failed.')
            }
          } catch {
            setIsProcessingStripe(false)
            alert('Error verifying payment with server.')
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.emailAddresses[0]?.emailAddress || ''
        },
        theme: {
          color: '#8b5cf6' // Violet accent matching ArcadeCore styling
        }
      }

      setIsProcessingStripe(false)
      const rzp = new (window as any).Razorpay(options)
      rzp.open()

    } catch (e) {
      setIsProcessingStripe(false)
      alert('Network error connecting to payment gateway.')
    }
  }

  // Purchase cosmetic border
  const handleBuyBorder = (id: string, cost: number) => {
    if (coins < cost) {
      alert('Insufficient Coins! Play more games or buy coins from the Stripe catalog.')
      return
    }

    const nextCoins = coins - cost
    const nextUnlocked = [...unlockedBorders, id]
    
    triggerCoinsUpdate(nextCoins)
    setUnlockedBorders(nextUnlocked)
    localStorage.setItem('arcadecore_unlocked_borders', JSON.stringify(nextUnlocked))
    
    sound.playWin()
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    })
  }

  // Equip border cosmetic
  const handleEquipBorder = (id: string) => {
    setEquippedBorder(id)
    localStorage.setItem('arcadecore_equipped_border', id)
    // Dispatch a custom event in case layouts need to sync equipped borders in real-time
    window.dispatchEvent(new Event('arcadecore_border_equipped'))
    sound.playClick()
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto flex flex-col gap-8 w-full my-2">
        
        {/* Page Banner Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <h1 className="text-2xl font-black font-display tracking-wider uppercase text-foreground flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary animate-pulse" />
              <span>Coin & Cosmetics Shop</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acquire coin balances securely via Stripe or spend coins on custom-designed retro profile borders.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 rounded-2xl text-emerald-400 font-extrabold text-sm self-start">
            <Coins className="h-5 w-5 fill-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Balance: {coins} ArcadeCoins</span>
          </div>
        </div>

        {/* Stripe Processing Modal Overlay */}
        {isProcessingStripe && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 rounded-2xl glass border border-border flex flex-col items-center justify-center text-center gap-4 animate-pulse">
              <div className="h-10 w-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                Stripe secure gateway checkout
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We are processing your simulated credit card checkout. Please do not close this window.
              </p>
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {stripeSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>{stripeSuccessMessage}</span>
          </div>
        )}

        {/* Split Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* LEFT: STRIPE COIN STORE */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <Coins className="h-4.5 w-4.5 text-primary" />
              <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">
                Buy Coins (Stripe Secure Payments)
              </h2>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Card 1 */}
              <div className="p-4 rounded-2xl border border-border/40 bg-muted/20 flex items-center justify-between transition-all hover:scale-[1.01] hover:bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Coins className="h-5.5 w-5.5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-foreground uppercase">Starter Wallet</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">+500 ArcadeCoins</p>
                  </div>
                </div>
                <button
                  onClick={() => handleBuyCoins(500, 0.99)}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-primary/10"
                >
                  $0.99 USD
                </button>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between transition-all hover:scale-[1.01] relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-[8px] font-black text-white uppercase px-2 py-0.5 tracking-wider rounded-bl-lg">
                  Popular
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/25 border border-primary/30 flex items-center justify-center">
                    <Coins className="h-5.5 w-5.5 text-primary animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-foreground uppercase flex items-center gap-1">
                      Pro Sack
                      <Sparkles className="h-3 w-3 text-primary" />
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">+1,200 ArcadeCoins</p>
                  </div>
                </div>
                <button
                  onClick={() => handleBuyCoins(1200, 1.99)}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-primary/20"
                >
                  $1.99 USD
                </button>
              </div>

              {/* Card 3 */}
              <div className="p-4 rounded-2xl border border-border/40 bg-muted/20 flex items-center justify-between transition-all hover:scale-[1.01] hover:bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Coins className="h-5.5 w-5.5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-foreground uppercase">Whale Vault</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">+5,000 ArcadeCoins</p>
                  </div>
                </div>
                <button
                  onClick={() => handleBuyCoins(5000, 4.99)}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-primary/10"
                >
                  $4.99 USD
                </button>
              </div>
            </div>

            <div className="mt-2 p-3.5 rounded-xl border border-border/30 bg-muted/10 text-muted-foreground flex gap-2">
              <AlertCircle className="h-4.5 w-4.5 text-muted-foreground/70 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                Stripe sandbox environment is active. Standard transactions are simulated instantly; no actual money is charged.
              </p>
            </div>
          </div>

          {/* RIGHT: COSMETICS SHOP */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <Palette className="h-4.5 w-4.5 text-secondary" />
              <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">
                Avatar Border Shop
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {/* Default Border Option */}
              <div className="p-3 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={user?.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40'}
                    alt="Sample"
                    className="w-10 h-10 rounded-lg object-cover bg-muted"
                    suppressHydrationWarning
                  />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Standard Frame</h4>
                    <p className="text-[9px] text-muted-foreground">Original profile format.</p>
                  </div>
                </div>

                {equippedBorder === 'none' ? (
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] rounded-lg uppercase tracking-wider flex items-center gap-1">
                    <Check className="h-3 w-3" /> Equipped
                  </span>
                ) : (
                  <button
                    onClick={() => handleEquipBorder('none')}
                    className="px-3 py-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Equip
                  </button>
                )}
              </div>

              {/* Loop cosmetics */}
              {COSMETICS_LIST.map((item) => {
                const isUnlocked = unlockedBorders.includes(item.id)
                const isEquipped = equippedBorder === item.id

                return (
                  <div key={item.id} className="p-3 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user?.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40'}
                        alt="Sample"
                        className={`w-10 h-10 rounded-lg object-cover bg-muted ${isEquipped ? item.borderStyle : ''}`}
                        suppressHydrationWarning
                      />
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{item.name}</h4>
                        <p className="text-[9px] text-muted-foreground leading-relaxed mt-0.5">{item.description}</p>
                      </div>
                    </div>

                    <div>
                      {isEquipped ? (
                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] rounded-lg uppercase tracking-wider flex items-center gap-1">
                          <Check className="h-3 w-3" /> Equipped
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipBorder(item.id)}
                          className="px-3 py-1 rounded-lg bg-primary hover:bg-primary/95 text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyBorder(item.id, item.cost)}
                          className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Coins className="h-3.5 w-3.5 fill-white" />
                          <span>{item.cost}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
        </div>

      </div>
    </AppShell>
  )
}
