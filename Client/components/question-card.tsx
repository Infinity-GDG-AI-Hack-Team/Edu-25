import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react"

interface QuestionCardProps {
  question: {
    id: number
    title: string
    content: string
    tags: string[]
    author: {
      name: string
      avatar: string
      questionsCount: number
      badge: string
    }
    upvotes: number
    answers: number
    createdAt: string
  }
}

export function QuestionCard({ question }: QuestionCardProps) {
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
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">{question.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{question.createdAt}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {question.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{question.content}</p>
        <div className="flex items-center gap-3 mt-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={question.author.avatar || "/placeholder.svg"} alt={question.author.name} />
            <AvatarFallback>{question.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{question.author.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{question.author.questionsCount} questions</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getBadgeColor(question.author.badge)}`}>
                {question.author.badge}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <ThumbsUp className="h-4 w-4" />
          <span>{question.upvotes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <MessageCircle className="h-4 w-4" />
          <span>{question.answers} answers</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
