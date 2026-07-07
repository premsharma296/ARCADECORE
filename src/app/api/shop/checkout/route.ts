import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe payments gate is not connected. Add STRIPE_SECRET_KEY to settings.' },
        { status: 500 }
      )
    }

    // Lazy instantiate Stripe inside handler to prevent Next.js build-time constructor crashes
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const { coins, price } = await req.json()
    if (!coins || !price) {
      return NextResponse.json({ error: 'Missing coins or price parameters' }, { status: 400 })
    }

    const origin = req.headers.get('origin') || 'https://arcadecore.in'

    // Create a hosted Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${coins.toLocaleString()} Arcade Coins`,
              description: `Get instant access to premium borders, custom badges, and VIP rewards in ArcadeCore!`,
              images: ['https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=200'],
            },
            unit_amount: Math.round(price * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/shop?success=true&session_id={CHECKOUT_SESSION_ID}&coins=${coins}&price=${price}`,
      cancel_url: `${origin}/shop?canceled=true`,
      metadata: {
        userId,
        coins: coins.toString(),
        price: price.toString(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe session creation failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
