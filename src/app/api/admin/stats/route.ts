import { NextResponse, NextRequest } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
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

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000)

    // 1. Database Queries - Strictly Real (No offsets, no hardcoded values)
    let totalUsers = 0
    let activeSessions = 0
    let totalRevenue = 0
    let gamePlaysToday = 0
    let newUsersToday = 0
    let usersList: any[] = []

    // Doughnut chart metrics
    let doughnutNew = 0
    let doughnutActive = 0
    let doughnutReturning = 0

    // Monthly chart data (12 values)
    const monthlyRevenue = Array(12).fill(0)

    // Diagnostic flags
    let dbConnected = false
    try {
      // Simple ping to verify connection
      await db.$queryRaw`SELECT 1`
      dbConnected = true

      // Run aggregations
      totalUsers = await db.user.count()
      activeSessions = await db.livePlayer.count({
        where: { lastSeen: { gte: fifteenMinsAgo } }
      })
      
      const revAgg = await db.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' }
      })
      totalRevenue = revAgg._sum.amount || 0

      gamePlaysToday = await db.gamePlay.count({
        where: { createdAt: { gte: startOfToday } }
      })

      newUsersToday = await db.user.count({
        where: { createdAt: { gte: startOfToday } }
      })

      // Fetch actual users list
      const dbUsers = await db.user.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' }
      })
      usersList = dbUsers.map(u => ({
        id: u.id,
        username: u.username || 'ArcadePlayer',
        email: u.email,
        avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40',
        isPremium: u.isPremium,
        createdAt: u.createdAt.toISOString()
      }))

      // Doughnut calculations
      doughnutNew = await db.user.count({
        where: { createdAt: { gte: startOfToday } }
      })
      
      // Active users (unique players today)
      const playedTodayList = await db.gamePlay.findMany({
        where: { createdAt: { gte: startOfToday } },
        select: { userId: true }
      })
      const uniqueUserIds = Array.from(new Set(playedTodayList.map(p => p.userId)))
      doughnutActive = uniqueUserIds.length

      // Returning users (registered before today, played today)
      const returningUserCount = await db.user.count({
        where: {
          id: { in: uniqueUserIds },
          createdAt: { lt: startOfToday }
        }
      })
      doughnutReturning = returningUserCount

      // Monthly revenue aggregation
      const startOfYear = new Date(new Date().getFullYear(), 0, 1)
      const txs = await db.transaction.findMany({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startOfYear }
        },
        select: {
          amount: true,
          createdAt: true
        }
      })
      txs.forEach(t => {
        const month = t.createdAt.getMonth()
        monthlyRevenue[month] += t.amount
      })

    } catch (e) {
      console.error('Postgres database aggregation failed:', e)
    }

    // Diagnostics checks
    const diagnostics = {
      database: dbConnected ? 'Connected' : 'Error',
      clerk: process.env.CLERK_SECRET_KEY ? 'Connected' : 'Not connected',
      stripe: process.env.STRIPE_SECRET_KEY ? 'Connected' : 'Not connected',
      googleAnalytics: 'Not connected',
      clarity: 'Not connected',
      googleSearchConsole: 'Not connected',
      redis: 'Not connected',
      cloudinary: 'Not connected',
      queueStatus: 'Inactive',
      backgroundJobs: 'Not configured'
    }

    return NextResponse.json({
      totalUsers,
      activeSessions,
      totalRevenue,
      gamePlaysToday,
      newUsersToday,
      users: usersList,
      doughnut: {
        newUsers: doughnutNew,
        activeUsers: doughnutActive,
        returningUsers: doughnutReturning
      },
      monthlyRevenue,
      diagnostics
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

    try {
      await db.user.delete({
        where: { id: userId }
      })
      return NextResponse.json({ success: true, message: 'User deleted persistently from PostgreSQL' })
    } catch {
      return NextResponse.json({ error: 'Database record not found or dependency constraints active' }, { status: 404 })
    }
  } catch (error: any) {
    console.error('Delete API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
