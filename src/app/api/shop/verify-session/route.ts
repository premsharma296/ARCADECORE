import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification credentials' }, { status: 400 })
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay secret credentials not configured' }, { status: 500 })
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

    // 2. Fetch the secure order details directly from the Razorpay API to prevent parameters spoofing
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const orderDetails = await razorpay.orders.fetch(razorpay_order_id)
    if (!orderDetails || !orderDetails.notes || !orderDetails.notes.coins) {
      return NextResponse.json({ error: 'Could not fetch securely verified order notes' }, { status: 400 })
    }

    const secureCoins = parseInt(orderDetails.notes.coins as string, 10)
    const securePrice = parseFloat((orderDetails.notes.price as string) || '0')

    // 3. Prevent double-crediting (check if payment_id has already been processed)
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
          coins: user?.coins || 0
        })
      }
    } catch {}

    // 4. Create transaction record and credit user coins balance persistently
    let updatedCoins = 0
    try {
      await db.transaction.create({
        data: {
          id: razorpay_payment_id, // Use unique Razorpay Payment ID as transaction ID to guarantee deduplication
          userId,
          amount: securePrice,
          coins: secureCoins,
          status: 'SUCCESS'
        }
      })

      const user = await db.user.update({
        where: { id: userId },
        data: {
          coins: { increment: secureCoins }
        }
      })
      updatedCoins = user.coins
    } catch (e: any) {
      console.error('Database write failed during Razorpay payment verification:', e)
      return NextResponse.json({ error: 'Failed to write transaction' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      coins: updatedCoins
    })
  } catch (error: any) {
    console.error('Razorpay verification failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
