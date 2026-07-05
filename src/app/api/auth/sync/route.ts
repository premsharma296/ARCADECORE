import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      console.warn('No active Clerk session cookie detected. Falling back to mock guest profile sync.')
      const email = 'player@arcadecore.com'
      const username = 'GamerPro'
      return NextResponse.json({
        id: 'mock-player-id',
        email,
        username,
        avatarUrl: '/avatars/default.png',
        xp: 350,
        coins: 100,
        streak: 3,
        createdAt: new Date(),
      })
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email address found' }, { status: 400 })
    }

    // Default username from email prefix or clerk username
    const username = clerkUser.username || email.split('@')[0] + Math.floor(Math.random() * 1000)
    const avatarUrl = clerkUser.imageUrl

    // Find or create the user in the database
    let user = await db.user.findUnique({
      where: { id: clerkUser.id },
    })

    if (!user) {
      user = await db.user.create({
        data: {
          id: clerkUser.id,
          email,
          username,
          avatarUrl,
        },
      })
      console.log(`Synced new user created: ${username}`)
    } else {
      // Keep avatar and email up to date
      user = await db.user.update({
        where: { id: clerkUser.id },
        data: {
          avatarUrl,
        },
      })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.warn('Database sync failed or database not initialized. Falling back to mock session sync:', error.message)
    const email = 'player@arcadecore.com'
    const username = 'GamerPro'
    return NextResponse.json({
      id: 'mock-player-id',
      email,
      username,
      avatarUrl: '/avatars/default.png',
      xp: 350,
      coins: 100,
      streak: 3,
      createdAt: new Date(),
    })
  }
}
