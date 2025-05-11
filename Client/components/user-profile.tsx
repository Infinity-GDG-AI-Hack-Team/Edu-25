import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export function UserProfile() {
  // Mock user data
  const user = {
    name: "Current User",
    avatar: "/icon_male_3.png",
    questionsCount: 7,
    answersCount: 12,
    upvotesReceived: 34,
    badge: "Silver",
    nextBadge: "Gold",
    progress: 70, // Progress to next badge (percentage)
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Platinum":
        return "bg-violet-100 text-violet-800"
      case "Gold":
        return "bg-amber-100 text-amber-800"
      case "Silver":
        return "bg-slate-100 text-slate-800"
      case "Bronze":
      default:
        return "bg-orange-100 text-orange-800"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Your Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">{user.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 ${getBadgeColor(user.badge)}`}>
            {user.badge} Member
          </span>

          <div className="grid grid-cols-3 gap-4 w-full mt-6 text-center">
            <div>
              <p className="font-semibold">{user.questionsCount}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div>
              <p className="font-semibold">{user.answersCount}</p>
              <p className="text-xs text-muted-foreground">Answers</p>
            </div>
            <div>
              <p className="font-semibold">{user.upvotesReceived}</p>
              <p className="text-xs text-muted-foreground">Upvotes</p>
            </div>
          </div>

          <div className="w-full mt-6">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress to {user.nextBadge}</span>
              <span>{user.progress}%</span>
            </div>
            <Progress value={user.progress} className="h-2" />
          </div>

          <Link href="/rewards" className="w-full mt-4">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Image src="/icon_female_1.png" alt="Rewards" width={16} height={16} />
              View Your Rewards
            </Button>
          </Link>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>Ask {11 - user.questionsCount} more questions to reach Gold status!</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
