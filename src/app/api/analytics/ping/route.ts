import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const { sessionId, path } = await req.json()

    // Resolve user ID: Use authenticated Clerk ID, fallback to anonymous session ID
    const resolvedUserId = userId || sessionId || 'anonymous-visitor'

    // Update or insert visitor presence
    try {
      // Clean up records older than 1 hour to keep table compact
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      await db.livePlayer.deleteMany({
        where: { lastSeen: { lt: oneHourAgo } }
      }).catch(() => {})

      // Find existing active presence
      const existing = await db.livePlayer.findFirst({
        where: { userId: resolvedUserId }
      })

      if (existing) {
        await db.livePlayer.update({
          where: { id: existing.id },
          data: {
            lastSeen: new Date(),
            gameId: path || null // track their current path/route
          }
        })
      } else {
        await db.livePlayer.create({
          data: {
            userId: resolvedUserId,
            gameId: path || null,
            lastSeen: new Date()
          }
        })
      }

      // Log a quick traffic aggregate entry for country/device if not logged in this session
      const userAgent = req.headers.get('user-agent') || ''
      const referer = req.headers.get('referer') || 'Organic'
      const country = req.headers.get('x-vercel-ip-country') || 'IN'

      let device = 'Desktop'
      if (/mobile/i.test(userAgent)) device = 'Mobile'
      else if (/tablet/i.test(userAgent)) device = 'Tablet'

      let browser = 'Chrome'
      if (/firefox/i.test(userAgent)) browser = 'Firefox'
      else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari'
      else if (/edg/i.test(userAgent)) browser = 'Edge'

      await db.trafficLog.create({
        data: {
          country,
          device,
          browser,
          referrer: referer.includes('google.com') ? 'Google Search' : 'Organic',
          path: path || '/'
        }
      }).catch(() => {})

    } catch (e) {
      console.error('Visitor telemetry write failed:', e)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
