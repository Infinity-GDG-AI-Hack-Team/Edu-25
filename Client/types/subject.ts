export interface Subject {
  id: string
  name: string
  status: "completed" | "needs_improvement" | "not_studied"
  score: number
  progress: number
  description: string
  deadline: string
  timeNeeded: number
}

export interface Link {
  source: string
  target: string
  value: number // 1 for prerequisite, 0.5 for related
}

export interface GraphData {
  nodes: Subject[]
  links: Link[]
}
