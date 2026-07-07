import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Razorpay from 'razorpay'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay is not connected in settings. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' },
        { status: 500 }
      )
    }

    // Lazy load Razorpay inside handler to avoid build-time key conflicts
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const { coins, price } = await req.json()
    if (!coins || !price) {
      return NextResponse.json({ error: 'Missing coins or price parameters' }, { status: 400 })
    }

    // Convert price to Indian Rupees (INR) for local payment processing (e.g. 1 USD = 85 INR)
    const inrRate = 85
    const priceInInr = Math.round(price * inrRate)
    const amountInPaise = priceInInr * 100

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId,
        coins: coins.toString(),
        price: price.toString(),
      }
    })

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      notes: order.notes
    })
  } catch (error: any) {
    console.error('Razorpay order creation failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
