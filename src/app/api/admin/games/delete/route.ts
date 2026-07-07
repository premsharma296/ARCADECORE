import { NextResponse, NextRequest } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import db from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Role verification (Admin checks)
    const isAdmin = user.emailAddresses.some(
      e => e.emailAddress.startsWith('admin') || 
           e.emailAddress === 'premchandsharma@gmail.com' || 
           e.emailAddress === 'itzpremsharma01@gmail.com'
    )

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing game ID' }, { status: 400 })
    }

    // Fetch game to find slug (for directory removal)
    const game = await db.game.findUnique({
      where: { id }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Delete uploaded files if any exist
    const uploadDir = path.join(process.cwd(), 'public', 'games-uploads', game.slug)
    if (fs.existsSync(uploadDir)) {
      try {
        fs.rmSync(uploadDir, { recursive: true, force: true })
      } catch (err) {
        console.warn('Could not clean up game directories:', err)
      }
    }

    // Delete record from DB
    await db.game.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Game successfully deleted' })

  } catch (error: any) {
    console.error('Delete game endpoint failed:', error)
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 })
  }
}
