'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function AnalyticsPing() {
  const pathname = usePathname()
  const { isSignedIn, user } = useUser()
  const sessionIdRef = useRef<string>('')

  // Generate anonymous session token
  useEffect(() => {
    try {
      let id = sessionStorage.getItem('arcadecore_session_id')
      if (!id) {
        id = 'sess-' + Math.random().toString(36).substring(2, 11)
        sessionStorage.setItem('arcadecore_session_id', id)
      }
      sessionIdRef.current = id
    } catch {
      sessionIdRef.current = 'sess-fallback'
    }
  }, [])

  useEffect(() => {
    const sendPing = () => {
      const payload = {
        sessionId: sessionIdRef.current,
        path: pathname
      }
      fetch('/api/analytics/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {})
    }

    // Trigger on mount/change and poll every 10 seconds
    sendPing()
    const timer = setInterval(sendPing, 10000)

    return () => clearInterval(timer)
  }, [pathname, isSignedIn, user])

  return null
}
