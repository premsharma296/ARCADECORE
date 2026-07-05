'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'

export default function AuthSync() {
  const { isSignedIn, user } = useUser()
  const synced = useRef(false)

  useEffect(() => {
    if (isSignedIn && user && !synced.current) {
      synced.current = true
      fetch('/api/auth/sync')
        .then((res) => {
          if (!res.ok) {
            console.error('Failed to sync user with database')
            synced.current = false // allow retry if failed
          } else {
            console.log('User synced successfully with database')
          }
        })
        .catch((err) => {
          console.error('Error syncing user:', err)
          synced.current = false
        })
    }
  }, [isSignedIn, user])

  return null
}
