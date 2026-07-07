import { NextResponse, NextRequest } from 'next/server'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, code, sdp, ice, role } = body

    if (action === 'create') {
      const roomCode = Math.floor(100000 + Math.random() * 900000).toString()
      await db.signalingRoom.create({
        data: {
          code: roomCode,
          hostSdp: sdp,
          status: 'waiting'
        }
      })
      return NextResponse.json({ success: true, code: roomCode })
    }

    if (action === 'join') {
      if (!code || !sdp) {
        return NextResponse.json({ error: 'Missing code or sdp' }, { status: 400 })
      }

      const room = await db.signalingRoom.findUnique({
        where: { code }
      })

      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }

      await db.signalingRoom.update({
        where: { code },
        data: {
          guestSdp: sdp,
          status: 'connecting'
        }
      })

      return NextResponse.json({ success: true, hostSdp: room.hostSdp })
    }

    if (action === 'send_ice') {
      if (!code || !ice || !role) {
        return NextResponse.json({ error: 'Missing code, ice, or role' }, { status: 400 })
      }

      const room = await db.signalingRoom.findUnique({
        where: { code }
      })

      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }

      const key = role === 'host' ? 'hostIce' : 'guestIce'
      const existingIceStr = room[key]
      const existingIce = existingIceStr ? JSON.parse(existingIceStr) : []
      existingIce.push(ice)

      await db.signalingRoom.update({
        where: { code },
        data: {
          [key]: JSON.stringify(existingIce)
        }
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'poll') {
      if (!code) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 })
      }

      const room = await db.signalingRoom.findUnique({
        where: { code }
      })

      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        status: room.status,
        hostSdp: room.hostSdp,
        guestSdp: room.guestSdp,
        hostIce: room.hostIce ? JSON.parse(room.hostIce) : [],
        guestIce: room.guestIce ? JSON.parse(room.guestIce) : []
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Signaling Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
