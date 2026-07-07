import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function GET() {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    const report: any = {
      razorpay_key_id_present: !!keyId,
      razorpay_key_secret_present: !!keySecret,
      razorpay_key_id_preview: keyId ? `${keyId.substring(0, 8)}...` : 'None',
      node_env: process.env.NODE_ENV
    }

    if (!keyId || !keySecret) {
      return NextResponse.json({
        status: 'Error',
        message: 'Missing Razorpay environment variables in Vercel configuration.',
        details: report
      }, { status: 400 })
    }

    // Try to create a mock test order to verify Razorpay connection credentials
    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      })

      const testOrder = await razorpay.orders.create({
        amount: 100, // Rs 1
        currency: 'INR',
        receipt: `test_rcpt_${Date.now()}`
      })

      return NextResponse.json({
        status: 'Success',
        message: 'Razorpay credentials verified. Successfully generated test order.',
        orderId: testOrder.id,
        details: report
      })
    } catch (apiError: any) {
      return NextResponse.json({
        status: 'Error',
        message: 'Razorpay API rejected the credentials. Check your keys.',
        error_message: apiError.message,
        error_details: apiError,
        details: report
      }, { status: 500 })
    }

  } catch (globalError: any) {
    return NextResponse.json({
      status: 'Error',
      message: 'Global exception caught during diagnostic run.',
      error: globalError.message
    }, { status: 500 })
  }
}
