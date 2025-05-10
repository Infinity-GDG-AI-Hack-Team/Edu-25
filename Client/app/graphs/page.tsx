"use client"

import { useState, useRef, useEffect, FormEvent } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertCircle, HelpCircle, Calendar, Clock, Send, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

// Define TypeScript interfaces for our data structures
interface SubjectNode {
    id: string
    name: string
    status: "completed" | "needs_improvement" | "not_studied"
    score: number
    progress: number
    description: string
    deadline: string
    timeNeeded: number
    x?: number
    y?: number
    fx?: number | null
    fy?: number | null
}

interface LinkData {
    source: string | SubjectNode
    target: string | SubjectNode
    value: number
}

interface GraphData {
    nodes: SubjectNode[]
    links: LinkData[]
}

interface ChatMessage {
    role: "user" | "bot"
    content: string
}

export default function SubjectProgressGraph() {
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [chatOpen, setChatOpen] = useState(false)
    const [chatInput, setChatInput] = useState("")
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { role: "bot", content: "Hi there! I'm your study buddy. How can I help you with your subjects today?" },
    ])

    // Sample data for the graph with deadlines and time estimates
    const [graphData, setGraphData] = useState<GraphData>({
        nodes: [
            // Core subjects
            {
                id: "math101",
                name: "Mathematics 101",
                status: "completed",
                score: 92,
                progress: 100,
                description: "Introduction to calculus and algebra",
                deadline: "2025-05-20",
                timeNeeded: 0, // hours needed (0 if completed)
            },
            {
                id: "physics101",
                name: "Physics 101",
                status: "needs_improvement",
                score: 68,
                progress: 68,
                description: "Mechanics and thermodynamics",
                deadline: "2025-05-25",
                timeNeeded: 12,
            },
            {
                id: "cs101",
                name: "Computer Science 101",
                status: "completed",
                score: 88,
                progress: 100,
                description: "Introduction to programming",
                deadline: "2025-05-15",
                timeNeeded: 0,
            },
            {
                id: "chemistry101",
                name: "Chemistry 101",
                status: "not_studied",
                score: 0,
                progress: 0,
                description: "Basic chemical principles",
                deadline: "2025-06-10",
                timeNeeded: 30,
            },
            {
                id: "biology101",
                name: "Biology 101",
                status: "not_studied",
                score: 0,
                progress: 0,
                description: "Cell biology and genetics",
                deadline: "2025-06-15",
                timeNeeded: 25,
            },
            // Advanced subjects
            {
                id: "math201",
                name: "Mathematics 201",
                status: "needs_improvement",
                score: 72,
                progress: 72,
                description: "Advanced calculus",
                deadline: "2025-06-05",
                timeNeeded: 15,
            },
            {
                id: "physics201",
                name: "Physics 201",
                status: "not_studied",
                score: 0,
                progress: 0,
                description: "Electromagnetism and waves",
                deadline: "2025-06-20",
                timeNeeded: 35,
            },
            {
                id: "cs201",
                name: "Computer Science 201",
                status: "completed",
                score: 95,
                progress: 100,
                description: "Data structures and algorithms",
                deadline: "2025-05-18",
                timeNeeded: 0,
            },
            {
                id: "cs202",
                name: "Computer Science 202",
                status: "not_studied",
                score: 0,
                progress: 0,
                description: "Database systems",
                deadline: "2025-06-25",
                timeNeeded: 20,
            },
            // Specialized subjects
            {
                id: "ai301",
                name: "Artificial Intelligence",
                status: "not_studied",
                score: 0,
                progress: 0,
                description: "Machine learning and neural networks",
                deadline: "2025-07-10",
                timeNeeded: 40,
            },
            {
                id: "math301",
                name: "Mathematics 301",
                status: "not_studied",
                score: 0,
                progress: 0,
                description: "Linear algebra and optimization",
                deadline: "2025-07-05",
                timeNeeded: 30,
            },
            {
                id: "cs301",
                name: "Computer Science 301",
                status: "not_studied",
                score: 0,
                progress: 0,
                description: "Software engineering",
                deadline: "2025-07-15",
                timeNeeded: 25,
            },
        ],
        links: [
            // Prerequisites
            { source: "math101", target: "math201", value: 1 },
            { source: "math201", target: "math301", value: 1 },
            { source: "physics101", target: "physics201", value: 1 },
            { source: "cs101", target: "cs201", value: 1 },
            { source: "cs101", target: "cs202", value: 1 },
            { source: "cs201", target: "cs301", value: 1 },
            { source: "cs201", target: "ai301", value: 1 },
            { source: "math201", target: "ai301", value: 1 },
            // Related subjects
            { source: "math101", target: "physics101", value: 0.5 },
            { source: "physics101", target: "chemistry101", value: 0.5 },
            { source: "chemistry101", target: "biology101", value: 0.5 },
        ],
    })

    const [selectedNode, setSelectedNode] = useState<SubjectNode | null>(null)
    const [filter, setFilter] = useState("all")
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    // Add these state variables after the other useState declarations
    const [currentPage, setCurrentPage] = useState(1)
    const subjectsPerPage = 3
    const [progressFilter, setProgressFilter] = useState("all")

    // Filter nodes based on status
    const filteredData = {
        nodes: filter === "all" ? graphData.nodes : graphData.nodes.filter((node) => node.status === filter),
        links: graphData.links.filter((link) => {
            if (filter === "all") return true
            const sourceId = typeof link.source === "string" ? link.source : link.source.id
            const targetId = typeof link.target === "string" ? link.target : link.target.id
            const sourceNode = graphData.nodes.find((node) => node.id === sourceId)
            const targetNode = graphData.nodes.find((node) => node.id === targetId)
            return sourceNode && targetNode && (sourceNode.status === filter || targetNode.status === filter)
        }),
    }

    // Count subjects by status
    const counts = {
        completed: graphData.nodes.filter((node) => node.status === "completed").length,
        needs_improvement: graphData.nodes.filter((node) => node.status === "needs_improvement").length,
        not_studied: graphData.nodes.filter((node) => node.status === "not_studied").length,
        total: graphData.nodes.length,
    }

    // Node color based on status
    const getNodeColor = (node: SubjectNode): string => {
        switch (node.status) {
            case "completed":
                return "#10b981" // green
            case "needs_improvement":
                return "#f59e0b" // amber
            case "not_studied":
                return "#6b7280" // gray
            default:
                return "#6b7280"
        }
    }

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case "needs_improvement":
                return <AlertCircle className="h-5 w-5 text-amber-500" />
            case "not_studied":
                return <HelpCircle className="h-5 w-5 text-gray-500" />
            default:
                return null
        }
    }

    // Get status text
    const getStatusText = (status: string): string => {
        switch (status) {
            case "completed":
                return "Completed"
            case "needs_improvement":
                return "Needs Improvement"
            case "not_studied":
                return "Not Studied"
            default:
                return status
        }
    }

    // Get progress color
    const getProgressColor = (progress: number): string => {
        if (progress === 100) return "bg-green-500"
        if (progress >= 60) return "bg-amber-500"
        return "bg-gray-500"
    }

    // Format date to readable format
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }

    // Calculate days remaining until deadline
    const getDaysRemaining = (deadlineString: string): number => {
        const today = new Date()
        const deadline = new Date(deadlineString)
        const diffTime = deadline.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    // Get urgency class based on days remaining
    const getUrgencyClass = (daysRemaining: number): string => {
        if (daysRemaining <= 0) return "text-red-600 font-bold"
        if (daysRemaining <= 7) return "text-orange-500 font-bold"
        if (daysRemaining <= 14) return "text-amber-500"
        return "text-green-600"
    }

    // Handle chat input submission
    const handleChatSubmit = (e: FormEvent): void => {
        e.preventDefault()
        if (!chatInput.trim()) return

        // Add user message
        setChatMessages((prev) => [...prev, { role: "user", content: chatInput }])

        // Simulate bot response
        setTimeout(() => {
            let response = "I'll help you with that! What specific questions do you have about your studies?"

            // Simple keyword matching for demo purposes
            if (chatInput.toLowerCase().includes("deadline")) {
                response =
                    "I see you're concerned about deadlines. The closest upcoming exam is for Physics 101 on May 25th. You should focus on that first!"
            } else if (chatInput.toLowerCase().includes("difficult") || chatInput.toLowerCase().includes("hard")) {
                response =
                    "If you're finding a subject difficult, try breaking it down into smaller topics and tackle them one by one. Would you like me to suggest some study techniques?"
            } else if (chatInput.toLowerCase().includes("time") || chatInput.toLowerCase().includes("schedule")) {
                response =
                    "Based on your current progress, I recommend allocating more time to Physics 101 since the exam is coming up soon. You need approximately 12 more hours of study time."
            }

            setChatMessages((prev) => [...prev, { role: "bot", content: response }])
        }, 1000)

        setChatInput("")
    }

    // Update dimensions on resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect()
                setDimensions({ width, height })
            }
        }

        updateDimensions()
        window.addEventListener("resize", updateDimensions)
        return () => window.removeEventListener("resize", updateDimensions)
    }, [])

    // Render graph using D3
    useEffect(() => {
        if (!svgRef.current || dimensions.width === 0 || graphData.nodes.length === 0) return

        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove()

        const width = dimensions.width
        const height = dimensions.height || 480

        // Create a force simulation
        const simulation = d3
            .forceSimulation<SubjectNode>(graphData.nodes)
            .force(
                "link",
                d3
                    .forceLink<SubjectNode, LinkData>(graphData.links)
                    .id((d) => d.id)
                    .distance(100),
            )
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(50))

        // Create a container for the graph
        const g = svg.append("g")

        // Add zoom functionality
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform)
            })

        svg.call(zoom)

        // Create links
        const link = g
            .append("g")
            .selectAll("line")
            .data(graphData.links)
            .enter()
            .append("line")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", (d) => (d.value === 1 ? 2 : 1))
            .attr("stroke-dasharray", (d) => (d.value === 0.5 ? "3,3" : "none"))

        // Add arrowheads for prerequisite links
        svg
            .append("defs")
            .selectAll("marker")
            .data(["prerequisite"])
            .enter()
            .append("marker")
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("fill", "#999")
            .attr("d", "M0,-5L10,0L0,5")

        // Apply arrowheads to prerequisite links
        link.filter((d) => d.value === 1).attr("marker-end", "url(#prerequisite)")

        // Create node groups
        const node = g
            .append("g")
            .selectAll(".node")
            .data(graphData.nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .on("click", (event: MouseEvent, d: SubjectNode) => {
                setSelectedNode(d)
                event.stopPropagation()
            })
            .call(
                d3
                    .drag<SVGGElement, SubjectNode>()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended) as any,
            )

        // Add circles to nodes
        node.append("circle").attr("r", 10).attr("fill", (d) => getNodeColor(d))

        // Add text labels to nodes
        node
            .append("text")
            .attr("dy", 25)
            .attr("text-anchor", "middle")
            .text((d) => d.name)
            .attr("font-size", "12px")
            .attr("pointer-events", "none")

        // Clear selection when clicking on the background
        svg.on("click", () => setSelectedNode(null))

        // Update positions on each tick of the simulation
        simulation.on("tick", () => {
            link
                .attr("x1", (d) => {
                    const source = d.source as SubjectNode
                    return source.x || 0
                })
                .attr("y1", (d) => {
                    const source = d.source as SubjectNode
                    return source.y || 0
                })
                .attr("x2", (d) => {
                    const target = d.target as SubjectNode
                    return target.x || 0
                })
                .attr("y2", (d) => {
                    const target = d.target as SubjectNode
                    return target.y || 0
                })

            node.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`)
        })

        // Drag functions
        function dragstarted(event: d3.D3DragEvent<SVGGElement, SubjectNode, SubjectNode>, d: SubjectNode) {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
        }

        function dragged(event: d3.D3DragEvent<SVGGElement, SubjectNode, SubjectNode>, d: SubjectNode) {
            d.fx = event.x
            d.fy = event.y
        }

        function dragended(event: d3.D3DragEvent<SVGGElement, SubjectNode, SubjectNode>, d: SubjectNode) {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
        }

        // Cleanup
        return () => {
            simulation.stop()
        }
    }, [dimensions, filter])

    // Sort subjects by deadline (closest first)
    const sortedSubjects = [...graphData.nodes].sort((a, b) => {
        const dateA = new Date(a.deadline).getTime()
        const dateB = new Date(b.deadline).getTime()
        return dateA - dateB
    })

    // Filter subjects based on progressFilter
    const filteredSubjects =
        progressFilter === "all" ? sortedSubjects : sortedSubjects.filter((subject) => subject.status === progressFilter)

    // Get current page subjects
    const indexOfLastSubject = currentPage * subjectsPerPage
    const indexOfFirstSubject = indexOfLastSubject - subjectsPerPage
    const currentSubjects = filteredSubjects.slice(indexOfFirstSubject, indexOfLastSubject)
    const totalPages = Math.ceil(filteredSubjects.length / subjectsPerPage)

    // Pagination controls
    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [progressFilter])

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-center">Subject Progress Tracker</h1>

            {/* Progress Bars Section */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Subject Progress & Deadlines</CardTitle>
                    <CardDescription>Track your progress and upcoming exam dates</CardDescription>
                    <Tabs defaultValue="all" className="w-full mt-2" onValueChange={setProgressFilter}>
                        <TabsList className="grid grid-cols-4 w-full">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                            <TabsTrigger value="needs_improvement">Needs Improvement</TabsTrigger>
                            <TabsTrigger value="not_studied">Not Studied</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {currentSubjects.map((subject) => (
                            <div key={subject.id} className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(subject.status)}
                                        <span className="font-medium">{subject.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-sm">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>{subject.timeNeeded}h needed</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>Exam: {formatDate(subject.deadline)}</span>
                                        </div>
                                        <div className={`text-sm ${getUrgencyClass(getDaysRemaining(subject.deadline))}`}>
                                            {getDaysRemaining(subject.deadline)} days left
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Progress value={subject.progress} className={`h-2 ${getProgressColor(subject.progress)}`} />
                                    <span className="text-sm font-medium">{subject.progress}%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-muted-foreground">
                            Showing {indexOfFirstSubject + 1}-{Math.min(indexOfLastSubject, filteredSubjects.length)} of{" "}
                            {filteredSubjects.length} subjects
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1}>
                                Previous
                            </Button>
                            <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages}>
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-4">
                    <Card className="h-[600px] relative">
                        <CardHeader>
                            <CardTitle>Subject Relationship Graph</CardTitle>
                            <CardDescription>Visualize your subject progress and prerequisites</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 h-[480px]" ref={containerRef}>
                            <svg ref={svgRef} width="100%" height="100%" className="overflow-hidden" />
                        </CardContent>

                        {/* Chatbot Avatar */}
                        <div className="absolute bottom-4 right-4 z-10">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full h-14 w-14 bg-blue-50 shadow-lg hover:shadow-xl transition-all"
                                onClick={() => setChatOpen(true)}
                            >
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Study Buddy" />
                                    <AvatarFallback className="bg-blue-200 text-blue-800">SB</AvatarFallback>
                                </Avatar>
                            </Button>
                        </div>

                        {/* Chatbot Dialog */}
                        {chatOpen && (
                            <div className="absolute bottom-20 right-4 w-80 bg-white rounded-lg shadow-xl z-20 border overflow-hidden">
                                <div className="flex items-center justify-between p-3 bg-blue-100">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Study Buddy" />
                                            <AvatarFallback className="bg-blue-200 text-blue-800">SB</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">Study Buddy</span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <ScrollArea className="h-80 p-3">
                                    <div className="space-y-4">
                                        {chatMessages.map((message, index) => (
                                            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                                <div
                                                    className={`max-w-[80%] rounded-lg px-3 py-2 ${message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                                                        }`}
                                                >
                                                    {message.content}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                <form onSubmit={handleChatSubmit} className="p-3 border-t">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Ask for help with your studies..."
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                        />
                                        <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <div className="mt-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Legend</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-sm">Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-sm">Needs Improvement</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                            <span className="text-sm">Not Studied</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-[2px] bg-black"></div>
                            <span className="text-sm">Prerequisite</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-[1px] bg-black dashed"></div>
                            <span className="text-sm">Related Subject</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
