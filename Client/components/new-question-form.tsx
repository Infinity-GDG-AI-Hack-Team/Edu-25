"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface NewQuestionFormProps {
  onSubmit: (question: {
    title: string
    content: string
    tags: string[]
  }) => void
  onCancel: () => void
}

// Common tags for learning platform
const suggestedTags = [
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
]

export function NewQuestionForm({ onSubmit, onCancel }: NewQuestionFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    onSubmit({
      title,
      content,
      tags,
    })

    // Reset form
    setTitle("")
    setContent("")
    setTags([])
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag])
    }
    setTagInput("")
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput) {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Ask a New Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Question Title
            </label>
            <Input
              id="title"
              placeholder="What's your question? Be specific."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Details
            </label>
            <Textarea
              id="content"
              placeholder="Provide more context and details about your question..."
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags (up to 5)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
            <Input
              id="tags"
              placeholder="Add tags (press Enter to add)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              disabled={tags.length >= 5}
            />
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Suggested tags:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      if (!tags.includes(tag) && tags.length < 5) {
                        setTags([...tags, tag])
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || !content.trim()}>
            Post Question
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
