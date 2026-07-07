import { NextResponse, NextRequest } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import db from '@/lib/db'

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

    const body = await req.json()
    const {
      id,
      title,
      description,
      instructions,
      controls,
      iframeUrl,
      thumbnailUrl,
      bannerUrl,
      isFeatured,
      isSponsored,
      isPublished,
      version,
      licenseInfo,
      seoTitle,
      seoKeywords,
      seoDescription,
      trailerUrl,
      screenshots,
      categories, // string[] (slugs)
      tags, // string[] (slugs)
    } = body

    if (!title || !description || !iframeUrl || !thumbnailUrl) {
      return NextResponse.json({ error: 'Missing mandatory fields' }, { status: 400 })
    }

    // Auto-generate slug from title if not editing
    const slug = id 
      ? body.slug 
      : title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)

    const gameData = {
      title,
      slug,
      description,
      instructions,
      controls,
      iframeUrl,
      thumbnailUrl,
      bannerUrl,
      isFeatured: !!isFeatured,
      isSponsored: !!isSponsored,
      isPublished: isPublished !== undefined ? !!isPublished : true,
      version: version || '1.0.0',
      licenseInfo,
      seoTitle: seoTitle || title,
      seoKeywords,
      seoDescription: seoDescription || description,
      trailerUrl,
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      categories: {
        set: [],
        connect: Array.isArray(categories) ? categories.map((cSlug: string) => ({ slug: cSlug })) : []
      },
      tags: {
        set: [],
        connect: Array.isArray(tags) ? tags.map((tSlug: string) => ({ slug: tSlug })) : []
      }
    }

    let savedGame
    if (id) {
      // Update Game
      savedGame = await db.game.update({
        where: { id },
        data: gameData,
        include: {
          categories: true,
          tags: true
        }
      })
    } else {
      // Create New Game
      savedGame = await db.game.create({
        data: gameData,
        include: {
          categories: true,
          tags: true
        }
      })
    }

    return NextResponse.json({ success: true, game: savedGame })

  } catch (error: any) {
    console.error('Admin game save route failed:', error)
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 })
  }
}
