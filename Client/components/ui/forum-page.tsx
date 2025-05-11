"use client"

import { useState } from "react"
import { QuestionCard } from "@/components/question-card"
import { NewQuestionForm } from "@/components/new-question-form"
import { UserProfile } from "@/components/user-profile"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// Mock data for questions
const initialQuestions = [
  {
    id: 1,
    title: "How do I understand React hooks?",
    content: "I'm struggling with useEffect and useState. Can someone explain when to use each?",
    tags: ["React", "JavaScript", "Hooks"],
    author: {
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      questionsCount: 15,
      badge: "Gold",
    },
    upvotes: 24,
    answers: 3,
    createdAt: "2 hours ago",
  },
  {
    id: 2,
    title: "What's the difference between var, let, and const?",
    content: "I'm confused about when to use each of these variable declarations in JavaScript.",
    tags: ["JavaScript", "ES6", "Basics"],
    author: {
      name: "Mike Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      questionsCount: 8,
      badge: "Silver",
    },
    upvotes: 18,
    answers: 5,
    createdAt: "5 hours ago",
  },
  {
    id: 3,
    title: "How to implement authentication in Next.js?",
    content: "I'm building a Next.js app and need to add user authentication. What's the best approach?",
    tags: ["Next.js", "Authentication", "Web Development"],
    author: {
      name: "Alex Rivera",
      avatar: "/placeholder.svg?height=40&width=40",
      questionsCount: 23,
      badge: "Platinum",
    },
    upvotes: 32,
    answers: 7,
    createdAt: "1 day ago",
  },
  {
    id: 4,
    title: "Best practices for CSS Grid layout?",
    content: "I'm trying to create a responsive layout with CSS Grid. What are some best practices?",
    tags: ["CSS", "Web Design", "Responsive"],
    author: {
      name: "Jordan Taylor",
      avatar: "/placeholder.svg?height=40&width=40",
      questionsCount: 5,
      badge: "Bronze",
    },
    upvotes: 12,
    answers: 2,
    createdAt: "2 days ago",
  },
]

// All available tags for filtering
const allTags = [
  "JavaScript",
  "React",
  "Next.js",
  "CSS",
  "HTML",
  "TypeScript",
  "Node.js",
  "Python",
  "Data Science",
  "Machine Learning",
  "Web Design",
  "Authentication",
  "Hooks",
  "ES6",
  "Basics",
  "Responsive",
  "Web Development",
]

export function ForumPage() {
  const [questions, setQuestions] = useState(initialQuestions)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Filter questions based on search query and selected tags
  const filteredQuestions = questions.filter((question) => {
    const matchesSearch =
      question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.content.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => question.tags.includes(tag))

    return matchesSearch && matchesTags
  })

  const handleAddQuestion = (newQuestion: any) => {
    const questionWithDefaults = {
      ...newQuestion,
      id: questions.length + 1,
      upvotes: 0,
      answers: 0,
      createdAt: "Just now",
      author: {
        name: "Current User",
        avatar: "/placeholder.svg?height=40&width=40",
        questionsCount: 1,
        badge: "Bronze",
      },
    }

    setQuestions([questionWithDefaults, ...questions])
    setIsFormOpen(false)
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Learning Forum</h1>
          <p className="text-muted-foreground mt-1">Ask questions, share knowledge, earn rewards</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>{isFormOpen ? "Cancel" : "Ask a Question"}</Button>
      </div>

      {isFormOpen && (
        <div className="mb-8">
          <NewQuestionForm onSubmit={handleAddQuestion} onCancel={() => setIsFormOpen(false)} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search questions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {showFilters && (
            <div className="mb-6 p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Filter by tags:</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag)}
                    className="text-xs"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Tabs defaultValue="latest">
            <TabsList className="mb-6">
              <TabsTrigger value="latest">Latest</TabsTrigger>
              <TabsTrigger value="popular">Most Popular</TabsTrigger>
              <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
            </TabsList>

            <TabsContent value="latest" className="space-y-4">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((question) => <QuestionCard key={question.id} question={question} />)
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No questions found. Try adjusting your filters or be the first to ask!
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="popular" className="space-y-4">
              {filteredQuestions
                .sort((a, b) => b.upvotes - a.upvotes)
                .map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
            </TabsContent>

            <TabsContent value="unanswered" className="space-y-4">
              {filteredQuestions
                .filter((q) => q.answers === 0)
                .map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-1">
          <UserProfile />

          <div className="mt-8 p-4 border rounded-lg">
            <h3 className="font-medium mb-4">Top Contributors</h3>
            <div className="space-y-4">
              {[
                { name: "Alex Rivera", questions: 23, badge: "Platinum", avatar: "/icon_male_1.png" },
                { name: "Sarah Johnson", questions: 15, badge: "Gold", avatar: "/icon_female_1.png" },
                { name: "Mike Chen", questions: 8, badge: "Silver", avatar: "/icon_male_2.png" },
                { name: "Jordan Taylor", questions: 5, badge: "Bronze", avatar: "/icon_female_2.png" },
              ].map((user, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{user.questions} questions</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          user.badge === "Platinum"
                            ? "bg-violet-100 text-violet-800"
                            : user.badge === "Gold"
                              ? "bg-amber-100 text-amber-800"
                              : user.badge === "Silver"
                                ? "bg-slate-100 text-slate-800"
                                : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {user.badge}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 border rounded-lg">
            <h3 className="font-medium mb-4">Badge System</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800">Bronze</span>
                <span className="text-sm">1-5 questions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-800">Silver</span>
                <span className="text-sm">6-10 questions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">Gold</span>
                <span className="text-sm">11-20 questions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-violet-100 text-violet-800">Platinum</span>
                <span className="text-sm">21+ questions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
