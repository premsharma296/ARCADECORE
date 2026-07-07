import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import db from '@/lib/db'

// GET all quests, their current real database progress, and completion states
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    const allAchievements = await db.achievement.findMany()

    if (!userId) {
      // Fallback for anonymous users
      return NextResponse.json(
        allAchievements.map(ach => {
          let target = 1
          if (ach.title.includes('Speed')) target = 10000
          if (ach.title.includes('Puzzle')) target = 5000
          if (ach.title.includes('Level')) target = 5

          return {
            id: ach.id,
            title: ach.title,
            desc: ach.description,
            rewardXp: ach.xpReward,
            target,
            current: 0,
            claimed: false,
            category: getCategoryByTitle(ach.title)
          }
        })
      )
    }

    // Fetch user profile to get level
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    // Fetch user unlocked achievements list
    const unlocked = await db.userAchievement.findMany({
      where: { userId }
    })
    const unlockedIds = new Set(unlocked.map(u => u.achievementId))

    // Real database counts for progress calculation
    const commentCount = await db.comment.count({ where: { userId } }).catch(() => 0)
    const playCount = await db.gamePlay.count({ where: { userId } }).catch(() => 0)
    const spinCount = await db.dailyRewardClaim.count({ where: { userId } }).catch(() => 0)
    
    // Get highest score from user plays
    const highestPlay = await db.gamePlay.findFirst({
      where: { userId },
      orderBy: { score: 'desc' }
    }).catch(() => null)
    const topScore = highestPlay?.score || 0

    const quests = allAchievements.map(ach => {
      let target = 1
      let current = 0

      if (ach.title.includes('First Steps')) {
        target = 1
        current = playCount
      } else if (ach.title.includes('Daily Spinner') || ach.title.includes('Daily')) {
        target = 1
        current = spinCount
      } else if (ach.title.includes('Social Gamer') || ach.title.includes('Social')) {
        target = 1
        current = commentCount
      } else if (ach.title.includes('Speed Demon') || ach.title.includes('Speed')) {
        target = 10000
        current = topScore
      } else if (ach.title.includes('Puzzle Master') || ach.title.includes('Puzzle')) {
        target = 5000
        current = topScore
      } else if (ach.title.includes('Level 5') || ach.title.includes('Level')) {
        target = 5
        current = user?.level || 1
      } else {
        target = 1
        current = unlockedIds.has(ach.id) ? 1 : 0
      }

      return {
        id: ach.id,
        title: ach.title,
        desc: ach.description,
        rewardXp: ach.xpReward,
        target,
        current: Math.min(current, target),
        claimed: unlockedIds.has(ach.id),
        category: getCategoryByTitle(ach.title)
      }
    })

    return NextResponse.json(quests)
  } catch (error: any) {
    console.error('Failed to fetch quests:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST to claim quest completion XP reward persistently
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questId } = await req.json()
    if (!questId) {
      return NextResponse.json({ error: 'Missing questId parameter' }, { status: 400 })
    }

    // Verify quest exists
    const quest = await db.achievement.findUnique({
      where: { id: questId }
    })

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    }

    // Verify user has not already unlocked it
    const existingUnlock = await db.userAchievement.findFirst({
      where: {
        userId,
        achievementId: questId
      }
    })

    if (existingUnlock) {
      return NextResponse.json({ error: 'Quest reward already claimed' }, { status: 400 })
    }

    // 1. Create user achievement unlock record
    const claim = await db.userAchievement.create({
      data: {
        userId,
        achievementId: questId
      }
    })

    // 2. Increment user XP in database
    const user = await db.user.update({
      where: { id: userId },
      data: {
        xp: { increment: quest.xpReward }
      }
    })

    // 3. Sync level dynamically (e.g. 1000 XP per level)
    const nextLevel = Math.floor(user.xp / 1000) + 1
    let finalLevel = user.level
    if (nextLevel !== user.level) {
      const updated = await db.user.update({
        where: { id: userId },
        data: { level: nextLevel }
      })
      finalLevel = updated.level
    }

    return NextResponse.json({
      success: true,
      claim,
      xp: user.xp,
      level: finalLevel
    })
  } catch (error: any) {
    console.error('Failed to claim quest XP:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getCategoryByTitle(title: string): string {
  if (title.includes('Speed')) return 'Racing'
  if (title.includes('Daily')) return 'Daily'
  if (title.includes('Social')) return 'Social'
  if (title.includes('Puzzle')) return 'Puzzle'
  if (title.includes('Level')) return 'Milestone'
  return 'Adventure'
}
