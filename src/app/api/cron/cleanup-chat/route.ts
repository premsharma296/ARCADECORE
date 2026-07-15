import { NextResponse, NextRequest } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  // Securing the endpoint: verify Vercel Cron header
  const authHeader = req.headers.get('authorization')
  if (process.env.VERCEL === '1' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Delete all chat messages older than 24 hours
    const result = await db.chatMessage.deleteMany({
      where: {
        createdAt: { lt: oneDayAgo }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Chat cleanup completed successfully',
      deletedCount: result.count 
    })
  } catch (error: any) {
    console.error('Cron chat cleanup failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
