import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = user.emailAddresses.some(
      e => e.emailAddress.startsWith('admin') || 
           e.emailAddress === 'premchandsharma@gmail.com' || 
           e.emailAddress === 'itzpremsharma01@gmail.com'
    )

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const games = await db.game.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true,
        tags: true,
        developer: true
      }
    })

    return NextResponse.json({ success: true, games })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
