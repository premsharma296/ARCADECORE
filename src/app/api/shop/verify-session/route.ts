import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import crypto from 'crypto'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, coins, price } = body

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification credentials' }, { status: 400 })
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay secret key not configured' }, { status: 500 })
    }

    // 1. Verify Razorpay Payment Signature (HMAC SHA256)
    const text = `${razorpay_order_id}|${razorpay_payment_id}`
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment signature mismatch (unauthorized)' }, { status: 400 })
    }

    // 2. Prevent double-crediting (check if payment_id has already been processed)
    try {
      const existingTx = await db.transaction.findUnique({
        where: { id: razorpay_payment_id }
      })

      if (existingTx) {
        const user = await db.user.findUnique({
          where: { id: userId }
        })
        return NextResponse.json({
          success: true,
          alreadyProcessed: true,
          coins: user?.xp || 0
        })
      }
    } catch {}

    // 3. Create transaction record and credit user coins balance persistently
    let updatedXp = 0
    try {
      await db.transaction.create({
        data: {
          id: razorpay_payment_id, // Use unique Razorpay Payment ID as transaction ID to guarantee deduplication
          userId,
          amount: parseFloat(price || '0'),
          coins: parseInt(coins || '0', 10),
          status: 'SUCCESS'
        }
      })

      const user = await db.user.update({
        where: { id: userId },
        data: {
          xp: { increment: parseInt(coins || '0', 10) }
        }
      })
      updatedXp = user.xp
    } catch (e: any) {
      console.error('Database write failed during Razorpay payment verification:', e)
      return NextResponse.json({ error: 'Failed to write transaction' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      coins: updatedXp
    })
  } catch (error: any) {
    console.error('Razorpay verification failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
