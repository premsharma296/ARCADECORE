import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' }
    })
    const tags = await db.tag.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      categories,
      tags
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
