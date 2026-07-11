'use client'

import React, { useEffect, useState } from 'react'
import { Users } from 'lucide-react'

// Simulated live count fluctuating each second for realism
function useLiveCount(base: number, variance: number) {
  const [count, setCount] = useState(base)
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = Math.floor((Math.random() - 0.4) * variance)
      setCount(c => Math.max(base - variance * 3, c + delta))
    }, 4000)
    return () => clearInterval(interval)
  }, [base, variance])
  return count
}

export default function LiveOnlineCount() {
  const online = useLiveCount(2847, 12)

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 select-none">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Users className="h-3 w-3" />
      <span className="text-[11px] font-extrabold tabular-nums">{online.toLocaleString()}</span>
      <span className="text-[10px] font-semibold opacity-70">online</span>
    </div>
  )
}
