'use client'

import React, { useState, useEffect } from 'react'
import { Info, ExternalLink } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

interface AdBannerProps {
  zone: 'HEADER' | 'SIDEBAR'
}

export default function AdBanner({ zone }: AdBannerProps) {
  const { user } = useUser()
  const [currentAd, setCurrentAd] = useState(0)

  // Simulated Premium logic (Disable ads if user has premium status flag)
  // In a real app we'd read `isPremium` from a DB user record sync
  const isPremium = false // Mock premium toggle for client testing

  const AD_CAMPAIGNS = {
    HEADER: [
      {
        title: 'ArcadeCore Pro',
        desc: 'Unlock 120+ games, custom avatars, and double XP multiplier. Ad-free gaming.',
        cta: 'Go Premium - $2.99/mo',
        imgUrl: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=400&auto=format&fit=crop',
      },
      {
        title: 'Cyber Hostings',
        desc: 'Ultra-fast Next.js edge hosting. Deploy apps globally with 99.9% uptime guaranteed.',
        cta: 'Deploy Free Now',
        imgUrl: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=400&auto=format&fit=crop',
      },
    ],
    SIDEBAR: [
      {
        title: 'Neon Headset V2',
        desc: '3D Spatial Audio, active noise cancelling, and glowing neon LED trim.',
        cta: 'Buy Now - 20% Off',
        imgUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=250&auto=format&fit=crop',
      },
      {
        title: 'DevAcademy Bootcamp',
        desc: 'Learn React, Next.js, and Prisma from staff engineer mentors. Build real software projects.',
        cta: 'Enroll Today',
        imgUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=250&auto=format&fit=crop',
      },
    ],
  }

  useEffect(() => {
    if (isPremium) return

    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % AD_CAMPAIGNS[zone].length)
    }, 25000) // Rotate ads every 25 seconds

    return () => clearInterval(interval)
  }, [isPremium, zone])

  if (isPremium) return null

  const ad = AD_CAMPAIGNS[zone][currentAd]

  const containerClasses = zone === 'HEADER'
    ? 'w-full h-24 flex items-center justify-between px-6 bg-card border border-border/40 rounded-2xl overflow-hidden glass shadow-lg'
    : 'w-full aspect-[4/5] flex flex-col justify-between p-4 bg-card border border-border/40 rounded-2xl overflow-hidden glass shadow-lg'

  return (
    <div className={`${containerClasses} relative select-none group border border-primary/5 hover:border-primary/10 transition-colors`}>
      
      {/* Top Banner Tag */}
      <div className="absolute top-2.5 right-3 flex items-center gap-1 text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-black/40 px-1.5 py-0.5 rounded border border-white/5 z-10">
        <Info className="h-2 w-2" />
        <span>Sponsored</span>
      </div>

      {zone === 'HEADER' ? (
        // Horizontal Header Ad layout
        <div className="flex items-center gap-4 w-full h-full">
          <img src={ad.imgUrl} alt={ad.title} className="h-16 aspect-video rounded-lg object-cover border border-border/40" />
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{ad.title}</h5>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 leading-relaxed">{ad.desc}</p>
          </div>
          <a
            href="https://google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-4 rounded-xl bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
          >
            <span>{ad.cta}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : (
        // Vertical Sidebar Ad Layout
        <div className="flex flex-col gap-3 h-full justify-between">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border/40 bg-muted">
            <img src={ad.imgUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h5 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{ad.title}</h5>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{ad.desc}</p>
          </div>
          <a
            href="https://google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-9 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
          >
            <span>{ad.cta}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

    </div>
  )
}
