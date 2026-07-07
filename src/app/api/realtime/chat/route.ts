import { NextResponse, NextRequest } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const room = searchParams.get('room') || 'global'

    let messages: any[] = []
    try {
      messages = await db.chatMessage.findMany({
        where: { room },
        orderBy: { createdAt: 'asc' },
        take: 30
      })
    } catch {
      // Return empty list if DB connection is initializing
    }

    // Seed initial welcome messages if chat is empty
    if (messages.length === 0) {
      messages = [
        {
          id: 'welcome-1',
          room,
          username: 'SystemBot',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40',
          content: `Welcome to the ${room} chat room! Keep it friendly. 🎮`,
          isVip: true,
          createdAt: new Date(Date.now() - 60000)
        }
      ]
    }

    return NextResponse.json(messages)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { room, username, avatarUrl, content, isVip } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Moderate content (Simple profanity filter)
    const badWords = ['scam', 'cheat', 'hack', 'exploit', 'spam']
    let cleanContent = content
    badWords.forEach(word => {
      const reg = new RegExp(word, 'gi')
      cleanContent = cleanContent.replace(reg, '***')
    })

    let message
    try {
      message = await db.chatMessage.create({
        data: {
          room: room || 'global',
          username: username || 'GuestPlayer',
          avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40',
          content: cleanContent,
          isVip: !!isVip
        }
      })
    } catch {
      // Fallback local memory return if Postgres is offline
      message = {
        id: Date.now().toString(),
        room: room || 'global',
        username: username || 'GuestPlayer',
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40',
        content: cleanContent,
        isVip: !!isVip,
        createdAt: new Date()
      }
    }

    return NextResponse.json(message)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
