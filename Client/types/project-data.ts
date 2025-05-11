export interface ProjectData {
  _id?: string
  student_id?: number
  project_name: string
  files: {
    pdf: string[]
  }
  current_active_file: string
  student_knowledge_base?: any
  planning_graph: {
    nodes_id: string[]
    nodes: string[]
    edges: string[][]
    sequence: string[]
  }
  known_topics: string[]
}

export interface GraphNode {
  id: string
  name: string
  status: "completed" | "needs_improvement" | "not_studied"
  progress: number
}

export interface GraphLink {
  source: string
  target: string
  value: number
}
