import { NextResponse, NextRequest } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import db from '@/lib/db'

// Check admin role helper
async function verifyAdmin() {
  const user = await currentUser()
  if (!user) return false
  return user.emailAddresses.some(
    e => e.emailAddress.startsWith('admin') || 
         e.emailAddress === 'premchandsharma@gmail.com' || 
         e.emailAddress === 'itzpremsharma01@gmail.com'
  )
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. Fetch real database user count and live metrics
    let dbUserCount = 0
    let dbUsersList: any[] = []
    let liveSessionsCount = 0
    let dbRevenueSum = 0

    try {
      dbUserCount = await db.user.count()
      dbUsersList = await db.user.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' }
      })
      
      // Query active live players inside the last 15 minutes
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000)
      liveSessionsCount = await db.livePlayer.count({
        where: {
          lastSeen: { gte: fifteenMinsAgo }
        }
      })

      // Query total completed transaction aggregates
      const revenueAgg = await db.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' }
      })
      dbRevenueSum = revenueAgg._sum.amount || 0
    } catch (e) {
      console.log('Postgres queries failing/initializing, using fallbacks')
    }

    // 2. Format final statistics combining cloud data + baseline values
    const totalUsers = 15000 + dbUserCount
    const activeSessions = 800 + liveSessionsCount
    const totalRevenue = 17500 + dbRevenueSum

    // Match Dribbble default user list and append actual database users at the top
    const mockUsers = [
      {
        id: 'mock-1',
        username: 'Annette Black',
        email: 'gamxxxx@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=40&auto=format&fit=crop',
        isPremium: true,
        createdAt: new Date('2025-01-01T00:00:00Z')
      },
      {
        id: 'mock-2',
        username: 'Bessie Cooper',
        email: 'gamxxxx@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=40&auto=format&fit=crop',
        isPremium: false,
        createdAt: new Date('2025-01-01T00:00:00Z')
      },
      {
        id: 'mock-3',
        username: 'Kathryn Murphy',
        email: 'gamxxxx@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=40&auto=format&fit=crop',
        isPremium: true,
        createdAt: new Date('2025-01-01T00:00:00Z')
      },
      {
        id: 'mock-4',
        username: 'Guy Hawkins',
        email: 'gamxxxx@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=40&auto=format&fit=crop',
        isPremium: false,
        createdAt: new Date('2025-01-01T00:00:00Z')
      },
      {
        id: 'mock-5',
        username: 'Jacob Jones',
        email: 'gamxxxx@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=40&auto=format&fit=crop',
        isPremium: true,
        createdAt: new Date('2025-01-01T00:00:00Z')
      }
    ]

    // Map DB users to fit listing formats
    const formattedDbUsers = dbUsersList.map(u => ({
      id: u.id,
      username: u.username || 'ArcadePlayer',
      email: u.email,
      avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40',
      isPremium: u.isPremium,
      createdAt: u.createdAt
    }))

    const combinedUsers = [...formattedDbUsers, ...mockUsers]

    return NextResponse.json({
      totalUsers,
      activeSessions,
      totalRevenue,
      users: combinedUsers
    })
  } catch (error: any) {
    console.error('Stats API Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    if (userId.startsWith('mock-')) {
      // Mock delete success
      return NextResponse.json({ success: true, message: 'Mock user removed temporarily' })
    }

    try {
      await db.user.delete({
        where: { id: userId }
      })
      return NextResponse.json({ success: true, message: 'User deleted persistently from PostgreSQL database' })
    } catch {
      return NextResponse.json({ error: 'Database record not found or dependency constraints active' }, { status: 404 })
    }
  } catch (error: any) {
    console.error('Delete API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
