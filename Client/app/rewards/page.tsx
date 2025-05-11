"use client"

import { useState } from "react"
import Link from "next/link"
import BraynrHeader from "@/components/braynr-header"
import RewardAvatar from "@/components/reward-avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function RewardsPage() {
  const [points, setPoints] = useState(75)
  const [streak, setStreak] = useState(3)

  return (
    <>
      <BraynrHeader />
      <main className="flex min-h-screen flex-col items-center p-6 bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="w-full max-w-md mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Forum
            </Button>
          </Link>
        </div>

        <Card className="max-w-md w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-purple-800">Learning Buddy</CardTitle>
          </CardHeader>
          <CardContent>
            <RewardAvatar
              studentName="Alex"
              initialPoints={points}
              nextRewardAt={100}
              initialStreak={streak}
              onPointsChange={setPoints}
              onStreakChange={setStreak}
            />

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Complete activities to earn points and maintain your streak!</p>
              <p className="mt-1">Your streak resets if you miss a day.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
