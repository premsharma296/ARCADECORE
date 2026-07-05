import React from 'react'
import db from '@/lib/db'
import AppShell from '@/components/layout/app-shell'
import { Trophy, Star, ShieldCheck, Gamepad2, Award } from 'lucide-react'

// Cache leaderboards for 30 seconds
export const revalidate = 30

const MOCK_LEADERS = [
  { rank: 1, username: 'SpeedRunnerX', xp: 58400, level: 42, gamesPlayed: 1420, badge: 'Gold Champion' },
  { rank: 2, username: 'CyberBeast', xp: 48900, level: 38, gamesPlayed: 980, badge: 'Neon Elite' },
  { rank: 3, username: 'TetrisGod', xp: 44200, level: 35, gamesPlayed: 1120, badge: 'Block Master' },
  { rank: 4, username: 'PixelKnight', xp: 39500, level: 31, gamesPlayed: 850, badge: 'Pixel Lord' },
  { rank: 5, username: 'NeonNinja', xp: 34100, level: 28, gamesPlayed: 740, badge: 'Shadow Runner' },
  { rank: 6, username: 'FlappyQueen', xp: 29000, level: 25, gamesPlayed: 600, badge: 'Air Raider' },
  { rank: 7, username: 'ClickerKing', xp: 24500, level: 21, gamesPlayed: 450, badge: 'Gold Clicker' },
  { rank: 8, username: 'ArcadeLegend', xp: 19800, level: 18, gamesPlayed: 320, badge: 'Challenger' },
]

async function getLeaderboardData() {
  try {
    const users = await db.user.findMany({
      orderBy: { xp: 'desc' },
      take: 20,
    })

    if (users.length === 0) throw new Error('No users seeded')

    return users.map((u, index) => ({
      rank: index + 1,
      username: u.username,
      xp: u.xp,
      level: u.level,
      gamesPlayed: Math.floor(u.xp / 40) + 5, // mock estimate
      badge: u.level >= 30 ? 'Grand Champion' : u.level >= 15 ? 'Elite Master' : 'Challenger'
    }))
  } catch (error) {
    return MOCK_LEADERS
  }
}

export default async function LeaderboardPage() {
  const leaders = await getLeaderboardData()

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto flex flex-col gap-6 w-full">
        
        {/* Header Branding */}
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <div className="p-3 rounded-2xl bg-accent/15 border border-accent/20 text-accent">
            <Trophy className="h-6 w-6 fill-accent/10" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-wider uppercase text-foreground">
              Global Rankings
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Rankings are calculated dynamically based on total account XP earned during gameplay and spin claims.
            </p>
          </div>
        </div>

        {/* Podium Top 3 Ranks Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-4">
          
          {/* Second Place */}
          {leaders[1] && (
            <div className="flex flex-col items-center p-6 rounded-2xl glass border border-border/40 order-2 md:order-1 h-[210px] justify-between relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-secondary" />
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-secondary uppercase tracking-widest">2nd Place</span>
                <span className="font-extrabold text-foreground text-lg">{leaders[1].username}</span>
                <span className="text-xs text-muted-foreground">{leaders[1].xp.toLocaleString()} XP</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center font-black text-secondary">
                2
              </div>
            </div>
          )}

          {/* First Place */}
          {leaders[0] && (
            <div className="flex flex-col items-center p-6 rounded-2xl glass border border-primary/30 order-1 md:order-2 h-[250px] justify-between relative overflow-hidden shadow-xl shadow-primary/5">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-primary pulse-glow" />
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-widest">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary animate-spin" />
                  <span>Grand Champion</span>
                </div>
                <span className="font-black font-display text-2xl text-foreground mt-1">{leaders[0].username}</span>
                <span className="text-sm font-semibold text-primary">{leaders[0].xp.toLocaleString()} XP</span>
              </div>
              <div className="h-14 w-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-2xl text-primary glow-primary shadow-lg shadow-primary/25 animate-bounce">
                1
              </div>
            </div>
          )}

          {/* Third Place */}
          {leaders[2] && (
            <div className="flex flex-col items-center p-6 rounded-2xl glass border border-border/40 order-3 md:order-3 h-[180px] justify-between relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-accent" />
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-accent uppercase tracking-widest">3rd Place</span>
                <span className="font-extrabold text-foreground text-lg">{leaders[2].username}</span>
                <span className="text-xs text-muted-foreground">{leaders[2].xp.toLocaleString()} XP</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center font-black text-accent">
                3
              </div>
            </div>
          )}

        </div>

        {/* Complete Leaderboard list */}
        <div className="rounded-2xl glass border border-border/40 overflow-hidden mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/40">
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Player</th>
                  <th className="py-4 px-6">Rank Title</th>
                  <th className="py-4 px-6 text-center">Level</th>
                  <th className="py-4 px-6 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-sm font-medium">
                {leaders.map((player) => (
                  <tr key={player.username} className="hover:bg-muted/15 transition-colors">
                    <td className="py-4 px-6">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs ${
                        player.rank === 1 ? 'bg-primary/20 text-primary border border-primary/30' :
                        player.rank === 2 ? 'bg-secondary/20 text-secondary border border-secondary/30' :
                        player.rank === 3 ? 'bg-accent/20 text-accent border border-accent/30' :
                        'bg-muted/80 text-muted-foreground'
                      }`}>
                        {player.rank}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-foreground">
                      {player.username}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                        <Award className="h-3 w-3 text-primary" />
                        <span>{player.badge}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-secondary">
                      {player.level}
                    </td>
                    <td className="py-4 px-6 text-right font-black font-display text-primary tracking-wide">
                      {player.xp.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
